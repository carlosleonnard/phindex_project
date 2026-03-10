import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://www.phenotypeindex.com',
  'https://phenotypeindex.com',
  'https://phindex.vercel.app',
  'http://localhost:8080',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

interface PhysicalVote {
  option: string;
  count: number;
  percentage: number;
}

interface PhysicalCharacteristic {
  name: string;
  votes: PhysicalVote[];
}

interface PhysicalVotesResponse {
  characteristics: PhysicalCharacteristic[];
  userVotes: { [key: string]: string };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate JWT via Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate the token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get profileId and userId from either query params or request body
    const url = new URL(req.url);
    let profileId = url.searchParams.get('profileId');
    let userId = url.searchParams.get('userId');

    // If not in query params, check request body
    if (!profileId) {
      try {
        const body = await req.json();
        profileId = body.profileId;
        userId = body.userId;
      } catch {
        // If both fail, profileId will still be null
      }
    }

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: 'Profile ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const physicalCharacteristicTypes = [
      'Skin Color',
      'Hair Color', 
      'Hair Texture', 
      'Head Breadth',
      'Head Type',
      'Body Type',
      'Nasal Breadth',
      'Facial Breadth',
      'Jaw Type',
      'Eye Color'
    ];

    // Fetch all votes for all physical characteristics in one query
    const { data: allVotes, error: votesError } = await supabase
      .from('votes')
      .select('characteristic_type, classification')
      .eq('profile_id', profileId)
      .in('characteristic_type', physicalCharacteristicTypes);

    if (votesError) {
      throw votesError;
    }

    // Aggregate votes by characteristic type
    const characteristicsData: PhysicalCharacteristic[] = [];
    
    for (const characteristicType of physicalCharacteristicTypes) {
      const characteristicVotes = allVotes?.filter(vote => 
        vote.characteristic_type === characteristicType
      ) || [];

      const voteCounts: { [key: string]: number } = {};
      characteristicVotes.forEach(vote => {
        voteCounts[vote.classification] = (voteCounts[vote.classification] || 0) + 1;
      });

      const total = characteristicVotes.length;
      const voteData: PhysicalVote[] = Object.entries(voteCounts).map(([option, count]) => ({
        option,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      })).sort((a, b) => b.count - a.count);

      characteristicsData.push({
        name: characteristicType,
        votes: voteData
      });
    }

    // Fetch user's votes if userId is provided
    let userVotes: { [key: string]: string } = {};
    if (userId) {
      const { data: userVoteData, error: userVotesError } = await supabase
        .from('votes')
        .select('characteristic_type, classification')
        .eq('profile_id', profileId)
        .eq('user_id', userId)
        .in('characteristic_type', physicalCharacteristicTypes);

      if (!userVotesError) {
        userVoteData?.forEach(vote => {
          userVotes[vote.characteristic_type] = vote.classification;
        });
      }
    }

    const response: PhysicalVotesResponse = {
      characteristics: characteristicsData,
      userVotes
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...getCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' } 
      }
    );
  }
});

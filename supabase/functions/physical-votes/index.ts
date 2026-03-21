import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://www.phenotypeindex.com,https://phenotypeindex.com,http://localhost:5173,http://localhost:8080,http://localhost:8081')
  .split(',')
  .map(o => o.trim());

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate profileId format to prevent abuse
    if (typeof profileId !== 'string' || profileId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(profileId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Profile ID format' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate userId format if provided
    if (userId && (typeof userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))) {
      return new Response(
        JSON.stringify({ error: 'Invalid User ID format' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
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
      console.error('Error fetching votes:', votesError);
      throw votesError;
    }

    // Aggregate votes by characteristic type
    const characteristicsData: PhysicalCharacteristic[] = [];
    
    for (const characteristicType of physicalCharacteristicTypes) {
      // Filter votes for this characteristic
      const characteristicVotes = allVotes?.filter(vote => 
        vote.characteristic_type === characteristicType
      ) || [];

      // Count votes by classification
      const voteCounts: { [key: string]: number } = {};
      characteristicVotes.forEach(vote => {
        voteCounts[vote.classification] = (voteCounts[vote.classification] || 0) + 1;
      });

      // Calculate total and percentages
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

      if (userVotesError) {
        console.error('Error fetching user votes:', userVotesError);
      } else {
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
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in physical-votes function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
      }
    );
  }
});
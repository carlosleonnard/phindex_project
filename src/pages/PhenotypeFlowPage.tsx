import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/AppLayout";
import { SC } from "@/components/kt/Misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon } from "lucide-react";
import { usePhenotypeReferences } from "@/hooks/use-phenotype-references";
import { useState, useRef } from "react";
import { toast } from "sonner";

const phenotypeData = {
  "Northern America": [
    "Eskimid",
    "Margid", 
    "Pacificid",
    "Silvid"
  ],
  "Central America": [
    "Centralid"
  ],
  "Southern America": [
    "Amazonid",
    "Andid",
    "Lagid",
    "Patagonid"
  ],
  "North Africa": [
    "Mediterranid",
    "Orientalid"
  ],
  "East Africa": [
    "Ethiopid",
    "Nilotid",
    "Sudanid"
  ],
  "Sub-Saharan Africa": [
    "Bambutid",
    "Bantuid",
    "Congoid",
    "Khoid",
    "Sanid"
  ],
  "Central Asia": [
    "Tungid",
    "Turanid"
  ],
  "Southern Asia": [
    "Indid",
    "Indo Melanin",
    "Veddid"
  ],
  "Eastern Asia": [
    "Ainuid",
    "Sibirid",
    "Sinid"
  ],
  "Southeastern Asia": [
    "Negritid",
    "South Mongoloid"
  ],
  "Eastern Europe": [
    "Dinarid",
    "East Europid",
    "Turanid"
  ],
  "Southern Europe": [
    "Mediterranid"
  ],
  "Central Europe": [
    "Alpinid"
  ],
  "Northern Europe": [
    "Lappid",
    "Nordid"
  ],
  "Anatolia": [
    "Alpinid",
    "Armenoid",
    "Mediterranid",
    "Turanid"
  ],
  "Levant": [
    "Armenoid",
    "Mediterranid"
  ],
  "Arabian Peninsula": [
    "Orientalid",
    "Veddid"
  ],
  "Persian Plateau": [
    "Orientalid"
  ],
  "Australia and New Zealand": [
    "Australid"
  ],
  "Melanesia": [
    "Melanesid"
  ],
  "Polynesia": [
    "Polynesid"
  ]
};

const phenotypeRegions = [
  {
    name: "Europe",
    subregions: [
      "Eastern Europe",
      "Central Europe", 
      "Southern Europe",
      "Northern Europe"
    ]
  },
  {
    name: "Africa",
    subregions: [
      "North Africa",
      "East Africa",
      "Sub-Saharan Africa"
    ]
  },
  {
    name: "Middle East",
    subregions: [
      "Levant",
      "Anatolia",
      "Arabian Peninsula",
      "Persian Plateau"
    ]
  },
  {
    name: "Asia",
    subregions: [
      "Central Asia",
      "Eastern Asia",
      "Southern Asia", 
      "Southeastern Asia"
    ]
  },
  {
    name: "Americas",
    subregions: [
      "Northern America",
      "Central America",
      "Southern America"
    ]
  },
  {
    name: "Oceania",
    subregions: [
      "Australia and New Zealand",
      "Melanesia",
      "Polynesia"
    ]
  }
];

export default function PhenotypeFlowPage() {
  const { uploadImage, deleteImage, getImageUrl, isUploading } = usePhenotypeReferences();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getImageKey = (phenotype: string, gender: 'male' | 'female') => `${phenotype}-${gender}`;

  const getRegionFromSubregion = (subregion: string): string => {
    for (const region of phenotypeRegions) {
      if (region.subregions.includes(subregion)) {
        return region.name;
      }
    }
    return '';
  };

  const handleFileSelect = async (phenotype: string, subregion: string, gender: 'male' | 'female', file: File) => {
    try {
      const region = getRegionFromSubregion(subregion);
      const imageUrl = await uploadImage(file, phenotype, subregion, region, gender);
      if (imageUrl) {
        toast.success(`${gender} photo uploaded successfully for ${phenotype}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    }
  };

  const handleUploadClick = (phenotype: string, gender: 'male' | 'female') => {
    const key = getImageKey(phenotype, gender);
    const input = fileInputRefs.current[key];
    if (input) {
      input.click();
    }
  };

  const handleFileChange = (phenotype: string, subregion: string, gender: 'male' | 'female') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(phenotype, subregion, gender, file);
    }
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Phenotype Flow - Classification Reference | Phindex</title>
        <meta name="description" content="Browse the full phenotype classification reference by region, from Northern America to Oceania, with visual examples for each phenotype." />
        <link rel="canonical" href="https://www.phenotypeindex.com/phenotype-flow" />
        <meta property="og:title" content="Phenotype Flow - Classification Reference | Phindex" />
        <meta property="og:description" content="Browse the full phenotype classification reference by region, from Northern America to Oceania, with visual examples for each phenotype." />
        <meta property="og:url" content="https://www.phenotypeindex.com/phenotype-flow" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta property="og:image" content="https://www.phenotypeindex.com/og-phindex-faces.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@phenotypeindex" />
        <meta name="twitter:title" content="Phenotype Flow | Phindex" />
        <meta name="twitter:description" content="Browse the full phenotype classification reference by region, from Northern America to Oceania, with visual examples for each phenotype." />
        <meta name="twitter:image" content="https://www.phenotypeindex.com/og-phindex-faces.png" />
      </Helmet>
        <div>
          <div className="mb-8">
            <SC as="p" className="m-0 text-[16px] text-kt-teal">
              reference
            </SC>
            <h1 className="mb-0 mt-1 text-[clamp(48px,5.8vw,84px)] font-medium leading-[0.95] tracking-[-0.028em] text-kt-ink">
              Phenotype flow
            </h1>
            <p className="mb-0 mt-3 text-[19px] italic text-kt-body">
              Explore phenotypic diversity across different geographic regions.
            </p>
          </div>

          <div className="space-y-6">
            {phenotypeRegions.map((region, regionIndex) => (
              <Card key={regionIndex} className="w-full">
                <CardHeader>
                  <CardTitle className="text-[28px] font-medium text-kt-ink">
                    {region.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {region.subregions.map((subregion, subregionIndex) => (
                      <AccordionItem key={subregionIndex} value={`${regionIndex}-${subregionIndex}`}>
                        <AccordionTrigger className="text-[19px] font-normal text-kt-ink">
                          {subregion}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-6">
                            {phenotypeData[subregion as keyof typeof phenotypeData]?.map((phenotype, phenotypeIndex) => (
                              <div key={phenotypeIndex} className="rounded-[3px] border border-kt-rule bg-white p-4">
                                <h4 className="mb-4 mt-0 text-[20px] font-medium text-kt-ink">{phenotype}</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Male section */}
                                  <div className="space-y-3">
                                    <h5 className="m-0 font-sc text-[15px] tracking-[0.06em] text-kt-slate">male</h5>
                                     <div className="rounded-[3px] border-[1.5px] border-dashed border-kt-b50 bg-kt-wash p-6 text-center transition-colors hover:border-kt-teal">
                                       {getImageUrl(phenotype, subregion, region.name, 'male') ? (
                                         <div className="relative">
                                           <img 
                                             src={getImageUrl(phenotype, subregion, region.name, 'male')!} 
                                             alt={`${phenotype} male reference`}
                                             className="max-h-48 mx-auto rounded object-cover"
                                           />
                                         </div>
                                       ) : (
                                        <>
                                          <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                          <p className="text-sm text-muted-foreground mb-3">
                                            No male reference photo
                                          </p>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleUploadClick(phenotype, 'male')}
                                            disabled={isUploading}
                                          >
                                            <Upload className="h-4 w-4 mr-2" />
                                            {isUploading ? 'Uploading...' : 'Upload Male Photo'}
                                          </Button>
                                        </>
                                      )}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={(el) => fileInputRefs.current[getImageKey(phenotype, 'male')] = el}
                                        onChange={handleFileChange(phenotype, subregion, 'male')}
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Female section */}
                                  <div className="space-y-3">
                                    <h5 className="m-0 font-sc text-[15px] tracking-[0.06em] text-kt-slate">female</h5>
                                     <div className="rounded-[3px] border-[1.5px] border-dashed border-kt-b50 bg-kt-wash p-6 text-center transition-colors hover:border-kt-teal">
                                       {getImageUrl(phenotype, subregion, region.name, 'female') ? (
                                         <div className="relative">
                                           <img 
                                             src={getImageUrl(phenotype, subregion, region.name, 'female')!} 
                                             alt={`${phenotype} female reference`}
                                             className="max-h-48 mx-auto rounded object-cover"
                                           />
                                         </div>
                                       ) : (
                                        <>
                                          <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                          <p className="text-sm text-muted-foreground mb-3">
                                            No female reference photo
                                          </p>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleUploadClick(phenotype, 'female')}
                                            disabled={isUploading}
                                          >
                                            <Upload className="h-4 w-4 mr-2" />
                                            {isUploading ? 'Uploading...' : 'Upload Female Photo'}
                                          </Button>
                                        </>
                                      )}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={(el) => fileInputRefs.current[getImageKey(phenotype, 'female')] = el}
                                        onChange={handleFileChange(phenotype, subregion, 'female')}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )) || (
                              <p className="text-muted-foreground text-center py-8">
                                No phenotypes defined for this subregion
                              </p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
    </AppLayout>
  );
}
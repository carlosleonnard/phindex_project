/**
 * TAXONOMIA DE VOTO (taxonomy.ts)
 *
 * As listas que o voto, o jogo e os filtros compartilham. Os valores são os
 * gravados na tabela `votes` — mudar um texto aqui muda o que se grava, então
 * rótulos de exibição ficam fora deste arquivo.
 */

import type { Continent } from "./regions";

/** { Divisão: { Grupo principal: [subgrupos] | null } } */
export type PhenotypeStructure = {
  [division: string]: {
    [mainGroup: string]: string[] | null;
  };
};

export const PHENOTYPE_TAXONOMY: PhenotypeStructure = {
  "Capoid": {
    "Strandlooper": null,
    "Khoid": null,
    "Sandawe": null,
    "Sanid": [
      "Kalaharid",
      "Karroid"
    ]
  },
  "Negroid": {
    "Katangid": null,
    "Hadza": null,
    "Bantuid": [
      "North Bantuid",
      "Central Bantuid",
      "Chopi-Tswana",
      "South Bantuid",
      "Fengu-Pondo",
      "Xhosaid",
      "Malagasid"
    ],
    "Bambutid": [
      "East Bambutid",
      "West Bambutid",
      "Twa-Cwa"
    ],
    "Congolid": [
      "Mountain Dama",
      "Congolesid",
      "Mundu Mangbeto",
      "West Congolesid",
      "Guineo Camerunian",
      "Guinesid",
      "Sudano Guinesid",
      "Equatorial Sudanid",
      "Casamance"
    ],
    "Sudanid": [
      "East Sudanid",
      "Bobo",
      "Senegalid",
      "Middle Nile",
      "Fezzanid",
      "Shari"
    ],
    "Nilotid": [
      "Pre Nilotid",
      "Dinkaid",
      "Shillukid",
      "South Nilotid",
      "Nilo Hamitic"
    ]
  },
  "Caucasoid": {
    "Ethiopid": [
      "Proto Ethiopid",
      "Omotic",
      "East Ethiopid",
      "North Ethiopid",
      "South Ethiopid",
      "Maasai",
      "Central Ethiopid",
      "Saharan Ethiopid",
      "West Ethiopid",
      "Danakil",
      "Moorish",
      "Siwa"
    ],
    "Orientalid": [
      "Arabid",
      "Iranid",
      "Libyid",
      "Targid",
      "Egyptid",
      "Transcaspian",
      "Yemenid",
      "Assyroid",
      "Indo Iranid"
    ],
    "Indid": [
      "Gracile Indid",
      "Mountain Indid",
      "Sinhalesid",
      "Keralid",
      "North Indid",
      "Toda",
      "Indo Brachid",
      "Central Brachid",
      "East Brachid",
      "Indo Nordic",
      "Tibetid",
      "Malabarese"
    ],
    "Indo Melanid": [
      "Karnatid",
      "Kolid"
    ],
    "Mediterranid": [
      "Paleo Sardinian",
      "Canarid",
      "Berberid",
      "Eurafricanid",
      "Proto Iranid",
      "Trans Mediterranid",
      "Gracile Mediterranid",
      "Pontid",
      "North Pontid",
      "Paleo Atlantid",
      "North Atlantid"
    ],
    "Nordid": [
      "Proto Nordid",
      "Aisto Nordid",
      "Hallstatt",
      "Anglo-Saxon",
      "Trønder",
      "Dalofaelid",
      "Fenno Nordid",
      "Borreby"
    ],
    "East Europid": [
      "Tavastid",
      "Savolaxid",
      "Neo Danubian",
      "Pre Slavic",
      "Volgid",
      "Ladogan"
    ],
    "Lappid": [
      "Scando Lappid",
      "North Lappid"
    ],
    "Alpinid": [
      "West Alpinid",
      "Strandid",
      "East Alpinid",
      "Gorid",
      "African Alpinoid",
      "Baskid"
    ],
    "Dinarid": [
      "Norid",
      "Litorid",
      "Mtebid",
      "Carpathid"
    ],
    "Armenoid": [
      "Armenid",
      "Anatolid"
    ],
    "Turanid": [
      "East Pamirid",
      "Central Pamirid",
      "Plains Pamirid",
      "Andronovo-Turanid",
      "Alföld"
    ]
  },
  "Australoid": {
    "Veddid": [
      "Malid",
      "Vedda",
      "North Gondid",
      "South Gondid",
      "Toalid",
      "Senoid",
      "Arabian Veddoid",
      "Khmerid"
    ],
    "Negritid": [
      "North Andamanid",
      "South Andamanid",
      "Aetid",
      "Semangid",
      "Jahai Semangid"
    ],
    "Australid": [
      "Barrinean",
      "North Australid",
      "Desert Australid",
      "South Australid",
      "Tasmanid"
    ],
    "Melanesid": [
      "Paleo Melanesid",
      "Insular Melanesid",
      "Neo Melanesid",
      "Mountain Melanesid",
      "Tapirid",
      "Bukaid",
      "Brachio Melanesid",
      "Fijid"
    ]
  },
  "Mongoloid": {
    "Polynesid": [
      "South Polynesid",
      "Nesiotid",
      "Micronesid",
      "Robust Polynesid"
    ],
    "Ainuid": [
      "Aoshima",
      "Chikuzen",
      "Ishikawa"
    ],
    "South Mongolid": [
      "Palaungid",
      "South Palaungid",
      "East Palaungid",
      "Proto Malayid",
      "Dayakid",
      "Kachinid",
      "Shanid",
      "East Shanid",
      "Deutero Malayid",
      "Satsuma"
    ],
    "Sinid": [
      "Huanghoid",
      "Manchu-Korean",
      "Changkiangid",
      "Chukiangid",
      "Tonkinesid",
      "Annamid",
      "Kham",
      "Choshiu",
      "Yakonin"
    ],
    "Tungid": [
      "Gobid",
      "Baykal",
      "Amur-Sakhalin",
      "Katanga",
      "Mountain Aralid",
      "Aralid"
    ],
    "Sibirid": [
      "Uralid",
      "Yenisey",
      "Samoyedic",
      "Chukchid"
    ],
    "Eskimid": [
      "Inuid",
      "Bering Sea"
    ],
    "Pacificid": [
      "Pacifid",
      "California Pacifid",
      "Athabaskid",
      "Arizonid"
    ],
    "Silvid": [
      "Planid",
      "Appalacid"
    ],
    "Margid": [
      "Mexicid",
      "Sonorid",
      "Californid"
    ],
    "Centralid": [
      "Isthmid",
      "Maya",
      "Pueblid"
    ],
    "Amazonid": [
      "North Amazonid",
      "South Amazonid",
      "West Amazonid",
      "Chocó-Motilon"
    ],
    "Lagid": [
      "Lagoa Santa",
      "South Fuegid",
      "Huarpid",
      "Botocudo"
    ],
    "Patagonid": [
      "Bororo",
      "Pampid"
    ],
    "Andid": [
      "North Andid",
      "Central Andid",
      "South Andid"
    ]
  }
};


/** Sub-regiões votáveis por continente, na ordem da navegação. */
export const GEOGRAPHIC_OPTIONS: Record<Continent, string[]> = {
  Africa: ["North Africa", "East Africa", "Sub-Saharan Africa"],
  Americas: ["Northern America", "Central America", "Southern America"],
  Asia: ["Central Asia", "Eastern Asia", "Southern Asia", "Southeastern Asia"],
  Europe: ["Eastern Europe", "Central Europe", "Southern Europe", "Northern Europe"],
  "Middle East": ["Levant", "Anatolia", "Arabian Peninsula", "Persian Plateau"],
  Oceania: ["Australia and New Zealand", "Melanesia", "Polynesia"],
};

/** Todas as sub-regiões, em sequência. */
export const ALL_SUBREGIONS: string[] = Object.values(GEOGRAPHIC_OPTIONS).flat();

/** Uma entrada pesquisável da taxonomia: grupo principal ou subgrupo. */
export interface PhenotypeEntry {
  name: string;
  /** Grupo principal a que pertence; igual a `name` quando é o próprio grupo. */
  group: string;
  isGroup: boolean;
}

/** Grupos principais e subgrupos, achatados na ordem da taxonomia. */
export const PHENOTYPE_ENTRIES: PhenotypeEntry[] = Object.values(PHENOTYPE_TAXONOMY).flatMap(
  (groups) =>
    Object.entries(groups).flatMap(([group, subgroups]) => [
      { name: group, group, isGroup: true },
      ...(subgroups ?? []).map((name) => ({ name, group, isGroup: false })),
    ])
);

/** Só os grupos principais — o vocabulário do nível difícil do jogo. */
export const PHENOTYPE_GROUPS: string[] = Object.values(PHENOTYPE_TAXONOMY).flatMap((groups) =>
  Object.keys(groups)
);

const GROUP_BY_NAME = new Map(PHENOTYPE_ENTRIES.map((entry) => [entry.name.toLowerCase(), entry.group]));

/**
 * Grupo principal de um fenótipo ("Gracile Mediterranid" → "Mediterranid").
 * O nível difícil do jogo pergunta pelo grupo; os votos, que podem ser de
 * subgrupos, somam no grupo. Nomes fora da taxonomia voltam como estão.
 */
export const phenotypeGroupOf = (name: string): string => GROUP_BY_NAME.get(name.toLowerCase()) ?? name;

const SUBGROUPS_BY_GROUP = new Map(
  Object.values(PHENOTYPE_TAXONOMY).flatMap((groups) =>
    Object.entries(groups).map(([group, subgroups]) => [group, subgroups ?? []] as const)
  )
);

/** Subtipos de um grupo principal, na ordem da taxonomia; vazio quando o grupo não tem. */
export const subgroupsOf = (group: string): string[] => SUBGROUPS_BY_GROUP.get(group) ?? [];

/**
 * Se um voto responde o nível específico: nomeia um subtipo, ou um grupo que
 * não tem subtipos (Khoid, Hadza…), em que o próprio grupo é a resposta mais
 * fina. Um grupo COM subtipos responde só o nível geral — é o que os votos
 * anteriores ao voto em dois níveis gravavam quando paravam no grupo.
 */
export const isSpecificPhenotype = (name: string): boolean => {
  const group = phenotypeGroupOf(name);
  if (group.toLowerCase() !== name.toLowerCase()) return true;
  return subgroupsOf(group).length === 0;
};

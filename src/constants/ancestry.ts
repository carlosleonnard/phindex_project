/**
 * ANCESTRALIDADES (ancestry.ts)
 *
 * Opções do campo "known ancestry" dos perfis: povos, gentílicos e grupos.
 * A lista bruta tinha nomes repetidos (Ethiopian, Thai, Turkmen); o Set
 * remove as cópias, que viravam chaves duplicadas no React.
 */

const RAW_ANCESTRY = [
  'Celtic', 'Mediterranean', 'Slavic', 'Balkan', 'Baltic', 'Ashkenazi Jew',
  'Arabs', 'Persians', 'Turk', 'Kurds', 'Armenian', 'Assyrians', 'Berbers', 'Sephardic Jew',
  'Bantu', 'Yoruba', 'Igbu', 'Zulu', 'Nubian', 'Ethiopian', 'Pygmies', 'Tuareg',
  'Hindus', 'Sikhs', 'Punjabis', 'Bengalis', 'Gujaratis', 'Tamils', 'Nepalese',
  'Chinese', 'Korean', 'Japanese', 'Mongol', 'Manchus', 'Vietnamese', 'Filipino',
  'Indonesian', 'Malays', 'Tatars', 'Afghans', 'Native Americans', 'Inuit',
  'Mestizos', 'Afro-Caribbeans', 'Aboriginals', 'Maori', 'Polynesians', 'Melanesians', 'Gypsies','Scottish',
  'Welsh',
  'Hawaiian',
  'African-American',
  'North African',
  'West African',
  'East African',
  'Sub-Saharan African',
  'Scandinavian',
  'Southeast Asian',
  'East Asian',
  'Siberian', 'Basque', 'Galician', 'Catalonian', 'Occitan',

  // --- Lista expandida de países/gentílicos ---
  'Albanian', 'Algerian', 'Andorran', 'Angolan', 'Antiguan or Barbudan', 'Argentine', 
  'Australian', 'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini', 'Bangladeshi',
  'Barbadian', 'Belarusian', 'Belgian', 'Belizean', 'Beninese', 'Bhutanese', 'Bolivian',
  'Bosnian', 'Botswanan', 'Brazilian', 'Bruneian', 'Bulgarian', 'Burkinabé', 'Burundian',
  'Cape Verdean', 'Cambodian', 'Cameroonian', 'Canadian', 'Central African', 'Chadian',
  'Chilean', 'Colombian', 'Comorian', 'Congolese', 'Costa Rican', 'Ivorian', 'Croatian',
  'Cuban', 'Cypriot', 'Czech', 'Danish', 'Djiboutian', 'Dominican', 'Ecuadorian',
  'Egyptian', 'Salvadoran', 'Equatorial Guinean', 'Eritrean', 'Estonian', 'Swazi',
  'Ethiopian', 'Fijian', 'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian', 'German',
  'Ghanaian', 'Greek', 'Grenadian', 'Guatemalan', 'Guinean', 'Bissau-Guinean', 'Guyanese',
  'Haitian', 'Honduran', 'Hungarian', 'Icelander', 'Indian', 'Iranian',
  'Iraqi', 'Irish', 'Israeli', 'Italian', 'Jamaican', 'Jordanian', 'Kazakh',
  'Kenyan', 'I-Kiribati', 'Kuwaiti', 'Kyrgyz', 'Laotian',
  'Latvian', 'Lebanese', 'Basotho', 'Liberian', 'Libyan', 'Liechtensteiner', 'Lithuanian',
  'Luxembourger', 'Malagasy', 'Malawian', 'Maldivian', 'Malian', 'Maltese',
  'Marshallese', 'Mauritanian', 'Mauritian', 'Mexican', 'Micronesian', 'Moldovan',
  'Monegasque', 'Montenegrin', 'Moroccan', 'Mozambican', 'Burmese',
  'Namibian', 'Nauruan', 'Nepali', 'Dutch', 'New Zealander', 'Nicaraguan', 'Nigerien',
  'Nigerian', 'Macedonian', 'Norwegian', 'Omani', 'Pakistani', 'Palauan', 'Panamanian',
  'Papua New Guinean', 'Paraguayan', 'Peruvian', 'Polish', 'Portuguese', 'Qatari',
  'Romanian', 'Russian', 'Rwandan', 'Kittitian', 'Saint Lucian', 'Vincentian',
  'Samoan', 'Sammarinese', 'Sao Tomean', 'Saudi', 'Senegalese', 'Serbian', 'Seychellois',
  'Sierra Leonean', 'Singaporean', 'Slovak', 'Slovenian', 'Solomon Islander', 'Somali',
  'South African', 'South Sudanese', 'Spanish', 'Sri Lankan', 'Sudanese', 'Surinamese',
  'Swedish', 'Swiss', 'Syrian', 'Tajik', 'Tanzanian', 'Thai', 'Timorese', 'Togolese',
  'Tongan', 'Trinidadian', 'Tunisian', 'Turkmen', 'Tuvaluan', 'Ugandan',
  'Ukrainian', 'Emirati', 'British', 'American', 'Uruguayan', 'Uzbek', 'Ni-Vanuatu', 'Venezuelan', 'Yemeni', 'Zambian', 'Zimbabwean',
  'Palestinian', 'Taiwanese',

  // --- Étnicos adicionais ---
  'Han Chinese', 'Pashtuns', 'Turks', 'Hausa', 'Xhosa', 'Oromo', 'Amhara',
  'Ashanti', 'Javanese', 'Thai', 'Kinh', 'Sindhi', 'Baloch', 'Quechua', 'Aymara',
  'Maya', 'Romani', 'Mizrahi Jews', 'Ethiopian Jews',
  'Yemenite Jews', 'Karaite Jews', 'Maronites', 'Copts', 'Chaldeans',
  'Sunnis', 'Shias', 'Alawites', 'Druze', 'Ibadis', 'Ahmadis', 'Jains', 'Parsis',
  'Yazidis', 'Samaritans', 'Shintoists', 'Baháʼís', 'Rastafarians', 'Amazonian groups',
  'Andean groups',

  // --- Grupos novos adicionados ---
  // Europa
  'Bretons', 'Gaels',
  'Northern Italians', 'Southern Italians', 'Sardinians', 'Corsicans',
  'Anglo-Saxons', 'Normans', 'Frisians',
  'Rusyns', 'Sorbs', 'Kashubians',
  'Sami', 'Basques', 'Gagauz', 'Circassians', 'Chechens', 'Ingush',
  'Karaim', 'Krymchaks',

  // África
  'Beja', 'Mozabite',
  'Fulani', 'Mandinka', 'Wolof', 'Dogon', 'Akan', 'Ewe', 'Fon',
  'Kongo', 'Luba', 'Mongo',
  'Swahili', 'Tigrinya', 'Afar',
  'Khoisan', 'San', 'Khoikhoi', 'Herero', 'Tswana', 'Shona', 'Venda',

  // Oriente Médio / Ásia Ocidental
  'Bedouins', 'Turkmen', 'Azeris', 'Mandeans', 'Sabians',
  'Lurs', 'Gilaks', 'Mazandarani',

  // Ásia Central
  'Karakalpak', 'Uyghurs', 'Hazara',

  // Sul da Ásia
  'Rajputs', 'Marathas', 'Adivasi', 'Dalits',
  'Sinhalese', 'Veddas',
  'Sherpas', 'Newars', 'Gurkhas',

  // Sudeste Asiático
  'Lao', 'Shan',
  'Karen', 'Rohingya', 'Chin', 'Kachin',
  'Visayans', 'Tagalogs', 'Igorot', 'Moro',
  'Balinese', 'Dayak', 'Bugis', 'Toraja', 'Papuan peoples',
  'Montagnards', 'Hmong', 'Tay', 'Nung',

  // Leste Asiático
  'Zhuang', 'Tibetans', 'Hani', 'Yi', 'Dai', 'Hui',
  'Jeju islanders',
  'Ainu', 'Ryukyuan',

  // Oceania
  'Marquesan', 'Tahitian', 'Rapa Nui',
  'Kanak', 'Tolai', 'Motu',
  'Yolngu', 'Noongar', 'Arrernte', 'Torres Strait Islanders',

  // Américas
  'Cherokee', 'Sioux', 'Lakota', 'Apache', 'Navajo', 'Hopi', 'Cree', 'Métis',
  'Nahua', 'Mixtec', 'Zapotec', 'Totonac',
  'Mapuche', 'Chachapoya',
  'Taíno', 'Carib', 'Arawak', 'Garifuna',
  'Yanomami', 'Kayapó', 'Tikuna', 'Munduruku', 'Guarani', 'Tupinambá'
];

export const ANCESTRY_OPTIONS: string[] = Array.from(new Set(RAW_ANCESTRY));

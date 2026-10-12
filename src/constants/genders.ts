/**
 * GÊNERO DOS PERFIS (genders.ts)
 *
 * O formulário de criação sempre gravou "Male", "Female" e "Other"; o de
 * edição gravava "Masculino", "Feminino" e "Outro". Doze perfis ficaram com o
 * valor em português, que aparecia assim no site em inglês. `normalizeGender`
 * traduz na leitura; os formulários passam a gravar só em inglês.
 */

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

const LEGACY_GENDERS: Record<string, string> = {
  Masculino: "Male",
  Feminino: "Female",
  Outro: "Other",
};

export const normalizeGender = (value?: string | null): string => (value ? LEGACY_GENDERS[value] ?? value : "");

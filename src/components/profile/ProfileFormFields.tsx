/**
 * CAMPOS DO PERFIL (ProfileFormFields.tsx)
 *
 * Os campos de um rosto, compartilhados pelo modal de criação e pelo de
 * edição: quem é, fotos, nome, categoria (com a subcategoria logo abaixo, num
 * lugar só), altura e país, gênero e ancestralidade. Quem usa guarda o estado
 * e decide o que fazer no envio; aqui ficam o desenho e a validação.
 *
 * Os valores gravados são os de sempre: "User Profiles" para a comunidade, os
 * nomes de CATEGORY_OPTIONS e SUBCATEGORIES, e o gênero em inglês.
 */

import { useId, useRef, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { SC } from "@/components/kt/Misc";
import { ChoiceChips, ERROR_TEXT, FieldLabel, PhotoSlot, SearchSelect } from "@/components/kt/Form";
import { CATEGORY_OPTIONS, SUBCATEGORIES } from "@/constants/categories";
import { COUNTRY_OPTIONS } from "@/constants/country-options";
import { ANCESTRY_OPTIONS } from "@/constants/ancestry";
import { GENDER_OPTIONS } from "@/constants/genders";
import { cn } from "@/lib/utils";

export interface ProfileForm {
  name: string;
  country: string;
  gender: string;
  category: string;
  subcategory: string;
  height: string;
  ancestry: string[];
  frontImageUrl: string;
  profileImageUrl: string;
  isAnonymous: boolean | null;
}

export type ProfileFieldKey = "type" | "front" | "name" | "category" | "height" | "country" | "gender" | "ancestry";

export const PROFILE_FIELD_NAMES: Record<ProfileFieldKey, string> = {
  type: "who it is",
  front: "front photo",
  name: "name",
  category: "category",
  height: "height",
  country: "country",
  gender: "gender",
  ancestry: "ancestry",
};

/** Como o banco chama a categoria Community. */
export const COMMUNITY_CATEGORY = "User Profiles";

export const missingProfileFields = (form: ProfileForm): ProfileFieldKey[] => {
  const missing: ProfileFieldKey[] = [];
  if (form.isAnonymous === null) missing.push("type");
  if (!form.frontImageUrl) missing.push("front");
  if (!form.name.trim()) missing.push("name");
  if (!form.category) missing.push("category");
  const height = parseFloat(form.height);
  if (!(height >= 0.5 && height <= 3)) missing.push("height");
  if (!form.country) missing.push("country");
  if (!form.gender) missing.push("gender");
  if (form.ancestry.length === 0) missing.push("ancestry");
  return missing;
};

const TYPE_CHOICES = [
  { anonymous: true, title: "Someone I know, or me", note: "An anonymous community profile." },
  { anonymous: false, title: "A famous person", note: "A public figure, filed under a category." },
];

const GENDERS = GENDER_OPTIONS.map((value) => ({ value, label: value }));
const CATEGORY_CHOICES = CATEGORY_OPTIONS.map((value) => ({ value, label: value }));
const MAX_ANCESTRY = 5;

export const ProfileFormFields = ({
  form,
  update,
  missing,
  lockIsAnonymous = false,
  uploadingSlot,
  onUpload,
}: {
  form: ProfileForm;
  update: (patch: Partial<ProfileForm>) => void;
  /** Campos pendentes; vazio até a primeira tentativa de envio. */
  missing: ProfileFieldKey[];
  /** O tipo já veio decidido pelo botão que abriu o modal. */
  lockIsAnonymous?: boolean;
  uploadingSlot: "front" | "profile" | null;
  onUpload: (file: File, slot: "front" | "profile") => void;
}) => {
  const uid = useId();
  const typeRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isMissing = (key: ProfileFieldKey) => missing.includes(key);
  const famous = form.isAnonymous === false;
  const subcategories = famous && form.category ? SUBCATEGORIES[form.category] ?? [] : [];
  const ids = {
    type: `${uid}-type`,
    photos: `${uid}-photos`,
    name: `${uid}-name`,
    height: `${uid}-height`,
    country: `${uid}-country`,
    countryLabel: `${uid}-country-label`,
    gender: `${uid}-gender`,
    category: `${uid}-category`,
    subcategory: `${uid}-subcategory`,
    ancestry: `${uid}-ancestry`,
    ancestryLabel: `${uid}-ancestry-label`,
  };

  const chooseType = (anonymous: boolean) =>
    update({
      isAnonymous: anonymous,
      category: anonymous
        ? COMMUNITY_CATEGORY
        : form.category && form.category !== COMMUNITY_CATEGORY
          ? form.category
          : "",
      subcategory: anonymous ? "" : form.subcategory,
    });

  const onTypeKey = (event: KeyboardEvent, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const next = 1 - index;
    typeRefs.current[next]?.focus();
    chooseType(TYPE_CHOICES[next].anonymous);
  };

  return (
    <>
      {!lockIsAnonymous && (
        <section>
          <FieldLabel id={ids.type} required invalid={isMissing("type")}>
            who is it
          </FieldLabel>
          <div role="radiogroup" aria-labelledby={ids.type} className="grid gap-2.5 sm:grid-cols-2">
            {TYPE_CHOICES.map((choice, index) => {
              const active = form.isAnonymous === choice.anonymous;
              const tabStop = form.isAnonymous === null ? index === 0 : active;
              return (
                <button
                  key={choice.title}
                  ref={(node) => {
                    typeRefs.current[index] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={tabStop ? 0 : -1}
                  onClick={() => chooseType(choice.anonymous)}
                  onKeyDown={(event) => onTypeKey(event, index)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-[3px] border-[1.5px] px-4 py-3.5 text-left font-[inherit] transition-colors",
                    active
                      ? "border-kt-ink bg-kt-ink text-kt-paper"
                      : cn(
                          "bg-white text-kt-ink hover:border-kt-b50 hover:bg-kt-wash",
                          isMissing("type") ? "border-[#A3261B]/50" : "border-kt-rule"
                        )
                  )}
                >
                  <span className="text-[18px] font-medium leading-tight">{choice.title}</span>
                  <span className={cn("text-[14px] italic", active ? "text-kt-b25" : "text-kt-body")}>{choice.note}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <FieldLabel id={ids.photos} hint="a front photo is required">
          photos
        </FieldLabel>
        <div className="grid max-w-[420px] grid-cols-2 gap-3">
          <PhotoSlot
            id={`${uid}-front`}
            label="front photo"
            required
            url={form.frontImageUrl}
            uploading={uploadingSlot === "front"}
            invalid={isMissing("front")}
            onFile={(file) => onUpload(file, "front")}
            onClear={() => update({ frontImageUrl: "" })}
          />
          <PhotoSlot
            id={`${uid}-side`}
            label="side photo"
            url={form.profileImageUrl}
            uploading={uploadingSlot === "profile"}
            onFile={(file) => onUpload(file, "profile")}
            onClear={() => update({ profileImageUrl: "" })}
          />
        </div>
        {isMissing("front") && <p className={cn("mb-0 mt-2 text-[14px] italic", ERROR_TEXT)}>Add a front photo.</p>}
      </section>

      <section>
        <FieldLabel htmlFor={ids.name} required invalid={isMissing("name")}>
          name
        </FieldLabel>
        <Input
          id={ids.name}
          value={form.name}
          onChange={(event) => update({ name: event.target.value })}
          autoComplete="off"
          placeholder={famous ? "As the person is publicly known" : "A first name or a nickname"}
          aria-invalid={isMissing("name") || undefined}
          className={cn("h-12 text-[17px] md:text-[17px]", isMissing("name") && "border-[#A3261B]/60")}
        />
      </section>

      {form.isAnonymous !== null && (
        <section>
          {famous ? (
            <>
              <FieldLabel id={ids.category} required invalid={isMissing("category")}>
                category
              </FieldLabel>
              <ChoiceChips
                options={CATEGORY_CHOICES}
                value={form.category}
                onChange={(category) => update({ category, subcategory: "" })}
                labelledBy={ids.category}
                invalid={isMissing("category")}
              />
              {subcategories.length > 0 && (
                <div className="mt-5 border-l-[1.5px] border-kt-b50 pl-4">
                  <FieldLabel id={ids.subcategory} optional>
                    subcategory
                  </FieldLabel>
                  <ChoiceChips
                    options={subcategories.map((value) => ({ value, label: value }))}
                    value={form.subcategory}
                    onChange={(subcategory) => update({ subcategory })}
                    labelledBy={ids.subcategory}
                    allowDeselect
                  />
                </div>
              )}
            </>
          ) : (
            <p className="m-0 flex flex-wrap items-baseline gap-x-2.5 text-[16px] text-kt-ink">
              <SC className="text-[15px] font-semibold text-kt-slate">category</SC>
              Community
              <span className="italic text-kt-body">· where anonymous profiles live</span>
            </p>
          )}
        </section>
      )}

      <section className="grid gap-x-5 gap-y-7 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          <FieldLabel htmlFor={ids.height} required invalid={isMissing("height")} hint="in meters">
            height
          </FieldLabel>
          <Input
            id={ids.height}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.5"
            max="3"
            placeholder="1.75"
            value={form.height}
            onChange={(event) => update({ height: event.target.value })}
            aria-invalid={isMissing("height") || undefined}
            className={cn("h-12 text-[17px] md:text-[17px]", isMissing("height") && "border-[#A3261B]/60")}
          />
        </div>
        <div>
          <FieldLabel id={ids.countryLabel} htmlFor={ids.country} required invalid={isMissing("country")}>
            country
          </FieldLabel>
          <SearchSelect
            id={ids.country}
            options={COUNTRY_OPTIONS}
            value={form.country}
            onChange={(country) => update({ country })}
            placeholder="Search countries"
            labelledBy={ids.countryLabel}
            invalid={isMissing("country")}
          />
        </div>
      </section>

      <section>
        <FieldLabel id={ids.gender} required invalid={isMissing("gender")}>
          gender
        </FieldLabel>
        <ChoiceChips
          options={GENDERS}
          value={form.gender}
          onChange={(gender) => update({ gender })}
          labelledBy={ids.gender}
          invalid={isMissing("gender")}
        />
      </section>

      <section>
        <FieldLabel
          id={ids.ancestryLabel}
          htmlFor={ids.ancestry}
          required
          invalid={isMissing("ancestry")}
          hint={`up to ${MAX_ANCESTRY}`}
        >
          known ancestry
        </FieldLabel>
        <SearchSelect
          id={ids.ancestry}
          multiple
          max={MAX_ANCESTRY}
          options={ANCESTRY_OPTIONS}
          value={form.ancestry}
          onChange={(ancestry) => update({ ancestry })}
          placeholder="Search peoples and nationalities"
          labelledBy={ids.ancestryLabel}
          invalid={isMissing("ancestry")}
        />
      </section>
    </>
  );
};

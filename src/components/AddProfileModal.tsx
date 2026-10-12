/**
 * ADICIONAR UM ROSTO (AddProfileModal.tsx)
 *
 * Dois passos: as regras da casa, aceitas a cada abertura, e o formulário.
 *
 * Os campos vêm de ProfileFormFields (os mesmos do modal de edição), no lugar
 * dos <select> nativos de antes. A categoria é escolhida num lugar só — o
 * seletor antigo trazia a própria lista de subcategorias e o modal desenhava
 * outra embaixo, e as duas apareciam ao mesmo tempo.
 */

import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CenButton, outlineCapsule } from "@/components/kt/Centromere";
import { SC } from "@/components/kt/Misc";
import { ERROR_TEXT } from "@/components/kt/Form";
import {
  COMMUNITY_CATEGORY,
  PROFILE_FIELD_NAMES,
  ProfileFormFields,
  missingProfileFields,
  type ProfileForm,
} from "@/components/profile/ProfileFormFields";
import { useUserProfiles } from "@/hooks/use-user-profiles";
import { useAuth } from "@/hooks/use-auth";
import { useImageUpload } from "@/hooks/use-image-upload";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AddProfileModalProps {
  triggerExternal?: boolean;
  onTriggerExternalChange?: (value: boolean) => void;
  initialIsAnonymous?: boolean | null;
  lockIsAnonymous?: boolean;
}

const HOUSE_RULES = [
  "Respect the privacy and rights of the people in the photos.",
  "Only use images you have permission to share.",
  "Describe ancestry accurately and respectfully.",
  "No images of minors without appropriate consent.",
  "Keep the index respectful and inclusive.",
  "Classify what is visible, not stereotypes.",
];

const emptyForm = (isAnonymous: boolean | null): ProfileForm => ({
  name: "",
  country: "",
  gender: "",
  category: isAnonymous === true ? COMMUNITY_CATEGORY : "",
  subcategory: "",
  height: "",
  ancestry: [],
  frontImageUrl: "",
  profileImageUrl: "",
  isAnonymous,
});

export const AddProfileModal = ({
  triggerExternal = false,
  onTriggerExternalChange,
  initialIsAnonymous = null,
  lockIsAnonymous = false,
}: AddProfileModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createProfile } = useUserProfiles();
  const { uploadImage, isUploading } = useImageUpload();

  const [open, setOpen] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [form, setForm] = useState(() => emptyForm(initialIsAnonymous));
  const [uploadingSlot, setUploadingSlot] = useState<"front" | "profile" | null>(null);
  // Os campos só aparecem como pendentes depois da primeira tentativa de envio.
  const [attempted, setAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (triggerExternal) {
      setShowGuidelines(true);
      onTriggerExternalChange?.(false);
    }
  }, [triggerExternal, onTriggerExternalChange]);

  const update = (patch: Partial<ProfileForm>) => setForm((previous) => ({ ...previous, ...patch }));
  const missing = attempted ? missingProfileFields(form) : [];

  const upload = async (file: File, slot: "front" | "profile") => {
    setUploadingSlot(slot);
    try {
      const url = await uploadImage(file, slot);
      if (url) update(slot === "front" ? { frontImageUrl: url } : { profileImageUrl: url });
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleGuidelinesAccept = () => {
    setShowGuidelines(false);
    setOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setAttempted(true);
    if (missingProfileFields(form).length > 0) return;

    if (!user) {
      setSubmitError("Log in to add a face.");
      return;
    }

    try {
      const newProfile = await createProfile.mutateAsync({
        name: form.name.trim(),
        country: form.country,
        gender: form.gender,
        category: form.category,
        height: parseFloat(form.height),
        ancestry: form.ancestry.join(", "),
        frontImageUrl: form.frontImageUrl,
        profileImageUrl: form.profileImageUrl,
        isAnonymous: form.isAnonymous,
        subcategory: form.subcategory || null,
      });

      // Registro completo com todos os dados do formulário.
      const { error: completeProfileError } = await supabase.from("complete_profiles").insert({
        user_id: user.id,
        profile_id: newProfile.id,
        name: form.name.trim(),
        country: form.country,
        gender: form.gender,
        category: form.category,
        height: parseFloat(form.height),
        ancestry: form.ancestry.join(", "),
        is_anonymous: form.isAnonymous,
        subcategory: form.subcategory || null,
        front_image_url: form.frontImageUrl,
        profile_image_url: form.profileImageUrl || null,
        description: form.ancestry.join(", "),
      });

      if (completeProfileError) {
        console.error("Error creating complete profile record:", completeProfileError);
      }

      // O tipo volta ao valor inicial: quando o modal foi aberto por um botão
      // que já define o tipo, essa escolha precisa sobreviver ao reset.
      setForm(emptyForm(initialIsAnonymous));
      setAttempted(false);
      setOpen(false);
      navigate(`/user-profile/${newProfile.slug}`);
    } catch (error) {
      console.error("Error creating profile:", error);
      setSubmitError("Couldn’t add the face. Check your connection and try again.");
    }
  };

  const pendingNames = missing.map((key) => PROFILE_FIELD_NAMES[key]);
  const busy = createProfile.isPending || isUploading || uploadingSlot !== null;

  return (
    <>
      {/* Regras da casa */}
      <Dialog open={showGuidelines} onOpenChange={setShowGuidelines}>
        {!triggerExternal && !onTriggerExternalChange && (
          <DialogTrigger asChild>
            <CenButton size="sm" icon="plus">
              add a face
            </CenButton>
          </DialogTrigger>
        )}

        <DialogContent className="max-h-[92vh] w-[calc(100vw-24px)] max-w-[540px] gap-0 overflow-y-auto p-0 text-kt-ink">
          <div className="px-6 pb-6 pt-7 sm:px-8">
            <SC as="p" className="m-0 text-[14px] text-kt-teal">
              before you add a face
            </SC>
            <DialogTitle className="mt-1 text-[32px] font-medium leading-[1.05] tracking-[-0.015em] text-kt-ink">
              House rules
            </DialogTitle>
            <DialogDescription className="mb-0 mt-2 text-[17px] leading-[1.5] text-kt-body">
              Every face here is read by real people. By continuing, you agree to keep to these rules.
            </DialogDescription>
            <ol className="m-0 mt-5 list-none p-0">
              {HOUSE_RULES.map((rule, index) => (
                <li
                  key={rule}
                  className="flex gap-3.5 border-t border-kt-rule py-3 text-[17px] leading-[1.45] text-kt-ink last:border-b"
                >
                  <span className="w-5 shrink-0 text-[16px] italic text-kt-teal">{index + 1}</span>
                  {rule}
                </li>
              ))}
            </ol>
            <p className="mb-0 mt-4 text-[15px] leading-[1.55] text-kt-body">
              Check for duplicates before adding: inactive or duplicated profiles are cleaned out from time to time. To
              remove a profile, write to <a href="mailto:contact@phenotypeindex.com">contact@phenotypeindex.com</a>.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-kt-rule px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => setShowGuidelines(false)}
              className={outlineCapsule("h-11 font-[inherit] text-[17px]")}
            >
              cancel
            </button>
            <CenButton size="sm" onClick={handleGuidelinesAccept}>
              agree and continue
            </CenButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulário */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[min(94vh,940px)] w-[calc(100vw-24px)] max-w-[640px] flex-col gap-0 overflow-hidden p-0 text-kt-ink">
          <div className="border-b border-kt-rule px-6 pb-5 pt-7 sm:px-8">
            <SC as="p" className="m-0 text-[14px] text-kt-teal">
              add to the index
            </SC>
            <DialogTitle className="mt-1 text-[32px] font-medium leading-[1.05] tracking-[-0.015em] text-kt-ink">
              Add a face
            </DialogTitle>
            <DialogDescription className="mb-0 mt-1.5 text-[17px] italic text-kt-body">
              A clear photo and a few facts. The community reads the rest.
            </DialogDescription>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6 sm:px-8">
              <ProfileFormFields
                form={form}
                update={update}
                missing={missing}
                lockIsAnonymous={lockIsAnonymous}
                uploadingSlot={uploadingSlot}
                onUpload={upload}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-kt-rule px-6 py-4 sm:px-8">
              <p
                role="alert"
                className={cn(
                  "m-0 min-w-0 flex-[1_1_220px] text-[15px] leading-[1.4]",
                  submitError || pendingNames.length ? ERROR_TEXT : "text-kt-body"
                )}
              >
                {submitError ??
                  (pendingNames.length > 0 ? (
                    <>Still needed: {pendingNames.join(", ")}.</>
                  ) : (
                    <span className="italic">
                      <span className="not-italic text-kt-teal">*</span> required
                    </span>
                  ))}
              </p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setOpen(false)} className={outlineCapsule("h-11 font-[inherit] text-[17px]")}>
                  cancel
                </button>
                <CenButton type="submit" size="sm" disabled={busy}>
                  {createProfile.isPending ? "adding…" : uploadingSlot ? "uploading…" : "add the face"}
                </CenButton>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

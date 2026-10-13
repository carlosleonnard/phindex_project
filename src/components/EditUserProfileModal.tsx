/**
 * EDITAR UM ROSTO (EditUserProfileModal.tsx)
 *
 * Os mesmos campos do modal de criação (ProfileFormFields), já preenchidos.
 * Cada abertura recomeça do perfil salvo, então cancelar descarta as edições.
 *
 * Este formulário gravava o gênero em português ("Masculino"); ao abrir, o
 * valor é traduzido e salvar grava em inglês, como o de criação.
 */

import { useEffect, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CenButton, outlineCapsule } from "@/components/kt/Centromere";
import { SC } from "@/components/kt/Misc";
import { ERROR_TEXT } from "@/components/kt/Form";
import {
  PROFILE_FIELD_NAMES,
  ProfileFormFields,
  missingProfileFields,
  type ProfileForm,
} from "@/components/profile/ProfileFormFields";
import { useUserProfiles, UserProfile } from "@/hooks/use-user-profiles";
import { useImageUpload } from "@/hooks/use-image-upload";
import { normalizeGender } from "@/constants/genders";
import { cn } from "@/lib/utils";

interface EditUserProfileModalProps {
  profile: UserProfile;
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const formFromProfile = (profile: UserProfile): ProfileForm => ({
  name: profile.name ?? "",
  country: profile.country ?? "",
  gender: normalizeGender(profile.gender),
  category: profile.category ?? "",
  subcategory: profile.subcategory || "",
  height: profile.height != null ? String(profile.height) : "",
  ancestry: profile.ancestry
    ? profile.ancestry
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [],
  frontImageUrl: profile.front_image_url ?? "",
  profileImageUrl: profile.profile_image_url || "",
  isAnonymous: profile.is_anonymous ?? null,
});

export const EditUserProfileModal = ({ profile, open, onClose, isAdmin }: EditUserProfileModalProps) => {
  const { updateProfile } = useUserProfiles();
  const { uploadImage, isUploading } = useImageUpload();
  const [form, setForm] = useState(() => formFromProfile(profile));
  const [uploadingSlot, setUploadingSlot] = useState<"front" | "profile" | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(formFromProfile(profile));
    setAttempted(false);
    setSubmitError(null);
    // Recomeça só ao abrir; mudanças no perfil durante a edição não apagam o que foi digitado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setAttempted(true);
    if (missingProfileFields(form).length > 0) return;

    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        isAdmin,
        profileData: {
          name: form.name.trim(),
          country: form.country,
          gender: form.gender,
          category: form.category,
          subcategory: form.subcategory || null,
          height: parseFloat(form.height),
          ancestry: form.ancestry.join(", "),
          frontImageUrl: form.frontImageUrl,
          profileImageUrl: form.profileImageUrl,
          isAnonymous: form.isAnonymous,
        },
      });
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      setSubmitError("Couldn’t save the changes. Check your connection and try again.");
    }
  };

  const pendingNames = missing.map((key) => PROFILE_FIELD_NAMES[key]);
  const busy = updateProfile.isPending || isUploading || uploadingSlot !== null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[min(94vh,940px)] w-[calc(100vw-24px)] max-w-[640px] flex-col gap-0 overflow-hidden p-0 text-kt-ink">
        <div className="border-b border-kt-rule px-6 pb-5 pt-7 sm:px-8">
          <SC as="p" className="m-0 text-[14px] text-kt-teal">
            edit the profile
          </SC>
          <DialogTitle className="mt-1 text-[32px] font-medium leading-[1.05] tracking-[-0.015em] text-kt-ink">
            {(profile.name || "").trim() || "Edit profile"}
          </DialogTitle>
          <DialogDescription className="mb-0 mt-1.5 text-[17px] italic text-kt-body">
            Changes appear on the profile as soon as you save.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6 sm:px-8">
            <ProfileFormFields
              form={form}
              update={update}
              missing={missing}
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
              <button type="button" onClick={onClose} className={outlineCapsule("h-11 font-[inherit] text-[17px]")}>
                cancel
              </button>
              <CenButton type="submit" size="sm" disabled={busy}>
                {updateProfile.isPending ? "saving…" : uploadingSlot ? "uploading…" : "save changes"}
              </CenButton>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

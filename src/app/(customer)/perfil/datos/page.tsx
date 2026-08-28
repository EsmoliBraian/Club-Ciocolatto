import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { BackHeader } from "@/components/shared/back-header";
import { UpdateProfileForm } from "@/components/customer/update-profile-form";

export const metadata: Metadata = { title: "Mis datos" };

export default async function MyDataPage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6">
      <BackHeader title="Mis datos" />
      <UpdateProfileForm user={profile.user} />
    </div>
  );
}

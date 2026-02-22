'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma'; // Adjust path to your prisma client
import { revalidatePath } from 'next/cache';

export async function updateUserDetails(formData: {
  studentId: string;
  phone: string;
  pAddr1: string;
  pCity: string;
  pState: string;
  pZip: string;
  lAddr1: string;
  lCity: string;
  lState: string;
  lZip: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.user.update({
      where: { id: userId }, // id is the Clerk ID in your schema
      data: {
        studentId: formData.studentId,
        phoneNumber: formData.phone,
        permAddress1: formData.pAddr1,
        permCity: formData.pCity,
        permState: formData.pState,
        permZip: formData.pZip,
        tempAddress1: formData.lAddr1,
        tempCity: formData.lCity,
        tempState: formData.lState,
        tempZip: formData.lZip,
      },
    });

    revalidatePath('/'); // Clear cache to show new data
    return { success: true };
  } catch (error) {
    console.error("Database Update Error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
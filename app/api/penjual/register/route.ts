import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Ekstrak data
    const picEmail = formData.get("picEmail") as string;
    const password = formData.get("password") as string;
    const picPhotoFile = formData.get("picPhotoPath") as File | null;
    const picKtpFile = formData.get("picKtpFilePath") as File | null;

    // 1. Auth: Sign Up User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: picEmail,
      password: password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Registrasi gagal" },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 2. Storage: Upload Files
    let picPhotoPath = null;
    let picKtpFilePath = null;

    if (picPhotoFile) {
      const photoExt = picPhotoFile.name.split(".").pop();
      const photoPath = `${userId}/foto_pic.${photoExt}`;
      const { error: photoError } = await supabase.storage
        .from("seller-uploads")
        .upload(photoPath, picPhotoFile);

      if (photoError) {
        return NextResponse.json(
          { error: "Upload foto gagal" },
          { status: 500 }
        );
      }

      const { data: photoUrlData } = supabase.storage
        .from("seller-uploads")
        .getPublicUrl(photoPath);

      picPhotoPath = photoUrlData.publicUrl;
    }

    if (picKtpFile) {
      const ktpExt = picKtpFile.name.split(".").pop();
      const ktpPath = `${userId}/file_ktp.${ktpExt}`;
      const { error: ktpError } = await supabase.storage
        .from("seller-uploads")
        .upload(ktpPath, picKtpFile);

      if (ktpError) {
        return NextResponse.json(
          { error: "Upload KTP gagal" },
          { status: 500 }
        );
      }

      const { data: ktpUrlData } = supabase.storage
        .from("seller-uploads")
        .getPublicUrl(ktpPath);

      picKtpFilePath = ktpUrlData.publicUrl;
    }

    // 3. Database: Insert Seller Data
    const { error: dbError } = await supabase.from("sellers").insert({
      id: userId,
      store_name: formData.get("storeName"),
      store_description: formData.get("storeDescription"),
      pic_name: formData.get("picName"),
      pic_phone: formData.get("picPhone"),
      pic_street: formData.get("picStreet"),
      pic_rt: formData.get("picRT"),
      pic_rw: formData.get("picRW"),
      pic_village: formData.get("picVillage"),
      pic_city: formData.get("picCity"),
      pic_province: formData.get("picProvince"),
      pic_ktp_number: formData.get("picKtpNumber"),
      pic_photo_path: picPhotoPath,
      pic_ktp_file_path: picKtpFilePath,
      status: "PENDING",
    });

    if (dbError) {
      return NextResponse.json(
        { error: "Gagal menyimpan data penjual" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Registrasi berhasil! Cek email untuk aktivasi." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

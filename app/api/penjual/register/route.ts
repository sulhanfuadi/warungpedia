import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function validateRegistrationData(formData: FormData) {
  const errors: string[] = [];

  const email = formData.get("picEmail") as string;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push("Format email tidak valid");
  }

  const password = formData.get("password") as string;
  if (password.length < 8) {
    errors.push("Password minimal 8 karakter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password harus mengandung huruf besar");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password harus mengandung angka");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password harus mengandung simbol");
  }

  const phone = formData.get("picPhone") as string;
  if (!/^[0-9]{10,15}$/.test(phone)) {
    errors.push("Nomor HP harus 10-15 digit angka");
  }

  const ktpNumber = formData.get("picKtpNumber") as string;
  if (ktpNumber.length !== 16) {
    errors.push("Nomor KTP harus 16 digit");
  }

  return errors;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const validationErrors = validateRegistrationData(formData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join(", ") },
        { status: 400 }
      );
    }

    const picEmail = formData.get("picEmail") as string;
    const password = formData.get("password") as string;
    const picPhotoFile = formData.get("picPhotoPath") as File | null;
    const picKtpFile = formData.get("picKtpFilePath") as File | null;

    if (picPhotoFile && picPhotoFile.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran foto maksimal 2MB" },
        { status: 400 }
      );
    }

    if (picKtpFile && picKtpFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file KTP maksimal 5MB" },
        { status: 400 }
      );
    }

    console.log("🔍 Manual bucket check...");
    try {
      const testBlob = new Blob(["test"], { type: "text/plain" });
      const testPath = `_test_${Date.now()}.txt`;

      const { error: testError } = await supabaseAdmin.storage
        .from("seller-uploads")
        .upload(testPath, testBlob, { upsert: false });

      if (testError) {
        console.error("❌ Bucket test failed:", testError);
        return NextResponse.json(
          {
            error: "Storage bucket tidak dapat diakses",
            details: testError.message,
          },
          { status: 500 }
        );
      }

      console.log("✅ Bucket accessible!");
      await supabaseAdmin.storage.from("seller-uploads").remove([testPath]);
    } catch (err) {
      console.error("❌ Bucket check exception:", err);
      return NextResponse.json(
        {
          error: "Gagal mengakses storage",
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 500 }
      );
    }

    console.log("🔄 Attempting sign up with email:", picEmail);

    // GUNAKAN supabaseAdmin untuk bypass RLS
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: picEmail,
        password: password,
        email_confirm: false, // User harus konfirmasi email
        user_metadata: {
          full_name: formData.get("picName"),
        },
      });

    if (authError) {
      console.error("❌ Supabase Auth Error:", {
        message: authError.message,
        status: authError.status,
        name: authError.name,
      });

      if (authError.message.includes("invalid")) {
        return NextResponse.json(
          {
            error: "Format email tidak valid atau email sudah terdaftar",
            details: authError.message,
          },
          { status: 400 }
        );
      }

      if (authError.message.includes("already registered")) {
        return NextResponse.json(
          { error: "Email sudah terdaftar" },
          { status: 400 }
        );
      }

      if (authError.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Terlalu banyak percobaan. Silakan coba lagi nanti." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: authError.message || "Registrasi gagal" },
        { status: 400 }
      );
    }

    if (!authData.user) {
      console.error("❌ No user data returned from Supabase");
      return NextResponse.json(
        { error: "Registrasi gagal - user tidak dibuat" },
        { status: 400 }
      );
    }

    console.log("✅ User created:", authData.user.id);
    const userId = authData.user.id;

    let picPhotoPath = null;
    let picKtpFilePath = null;
    let photoExt = "";
    let ktpExt = "";

    if (picPhotoFile) {
      photoExt = picPhotoFile.name.split(".").pop() || "jpg";
      const photoPath = `${userId}/foto_pic.${photoExt}`;

      console.log("🔄 Uploading photo to:", photoPath);

      const { error: photoError } = await supabaseAdmin.storage
        .from("seller-uploads")
        .upload(photoPath, picPhotoFile, {
          contentType: picPhotoFile.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (photoError) {
        console.error("❌ Photo upload error:", photoError);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json(
          {
            error: "Upload foto gagal: " + photoError.message,
            details: photoError,
          },
          { status: 500 }
        );
      }

      const { data: photoUrlData } = supabaseAdmin.storage
        .from("seller-uploads")
        .getPublicUrl(photoPath);

      picPhotoPath = photoUrlData.publicUrl;
      console.log("✅ Photo uploaded:", picPhotoPath);
    }

    if (picKtpFile) {
      ktpExt = picKtpFile.name.split(".").pop() || "pdf";
      const ktpPath = `${userId}/file_ktp.${ktpExt}`;

      console.log("🔄 Uploading KTP to:", ktpPath);

      const { error: ktpError } = await supabaseAdmin.storage
        .from("seller-uploads")
        .upload(ktpPath, picKtpFile, {
          contentType: picKtpFile.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (ktpError) {
        console.error("❌ KTP upload error:", ktpError);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        if (picPhotoPath) {
          await supabaseAdmin.storage
            .from("seller-uploads")
            .remove([`${userId}/foto_pic.${photoExt}`]);
        }
        return NextResponse.json(
          {
            error: "Upload KTP gagal: " + ktpError.message,
            details: ktpError,
          },
          { status: 500 }
        );
      }

      const { data: ktpUrlData } = supabaseAdmin.storage
        .from("seller-uploads")
        .getPublicUrl(ktpPath);

      picKtpFilePath = ktpUrlData.publicUrl;
      console.log("✅ KTP uploaded:", picKtpFilePath);
    }

    console.log("🔄 Inserting seller data...");

    // GUNAKAN supabaseAdmin untuk bypass RLS
    const { error: dbError } = await supabaseAdmin.from("sellers").insert({
      id: userId,
      store_name: formData.get("storeName"),
      store_description: formData.get("storeDescription") || null,
      pic_name: formData.get("picName"),
      pic_phone: formData.get("picPhone"),
      pic_email: formData.get("picEmail"),
      pic_street: formData.get("picStreet"),
      pic_rt: formData.get("picRT"),
      pic_rw: formData.get("picRW"),
      pic_village: formData.get("picVillage"),
      pic_district: formData.get("picDistrict"),
      pic_city: formData.get("picCity"),
      pic_province: formData.get("picProvince"),
      pic_ktp_number: formData.get("picKtpNumber"),
      pic_photo_path: picPhotoPath,
      pic_ktp_file_path: picKtpFilePath,
      status: "PENDING",
      role: "seller",
    });

    if (dbError) {
      console.error("❌ Database error:", dbError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      if (picPhotoPath) {
        await supabaseAdmin.storage
          .from("seller-uploads")
          .remove([`${userId}/foto_pic.${photoExt}`]);
      }
      if (picKtpFilePath) {
        await supabaseAdmin.storage
          .from("seller-uploads")
          .remove([`${userId}/file_ktp.${ktpExt}`]);
      }
      return NextResponse.json(
        { error: "Gagal menyimpan data penjual: " + dbError.message },
        { status: 500 }
      );
    }

    console.log("✅ Seller data inserted successfully!");

    // Kirim email verifikasi
    const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: picEmail,
      password,
      options: {
        redirectTo: `${
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        }/penjual/verify`,
      },
    });

    if (emailError) {
      console.warn("⚠️ Email verification failed:", emailError);
    }

    return NextResponse.json(
      {
        message:
          "Registrasi berhasil! Silakan cek email Anda untuk aktivasi akun.",
        userId: userId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server yang tidak terduga",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { invalidateSystemSettingsCache } from "@/lib/system-settings";

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: {} });
    }
    return successResponse(settings);
  } catch (error) {
    console.error("GET /api/admin/system-settings error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const body = await request.json();
    const {
      maintenanceMode, maintenanceMsg, maxFileUploadMb, groqApiKey, appName, adminWhatsapp,
      priceMonthly, priceHalfYear, priceYearly, pricingEnabled,
      pakasirApiKey, pakasirSlug, pakasirSandbox, pakasirEnabled,
      googleClientId, googleClientSecret, driveTokenSecret,
    } = body;

    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: {} });
    }

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        maintenanceMode: maintenanceMode !== undefined ? maintenanceMode : settings.maintenanceMode,
        maintenanceMsg:  maintenanceMsg  !== undefined ? maintenanceMsg  : settings.maintenanceMsg,
        maxFileUploadMb: maxFileUploadMb !== undefined ? maxFileUploadMb : settings.maxFileUploadMb,
        groqApiKey:      groqApiKey      !== undefined ? groqApiKey      : settings.groqApiKey,
        appName:         appName         !== undefined ? appName         : settings.appName,
        adminWhatsapp:   adminWhatsapp   !== undefined ? adminWhatsapp   : settings.adminWhatsapp,
        priceMonthly:    priceMonthly    !== undefined ? priceMonthly    : settings.priceMonthly,
        priceHalfYear:   priceHalfYear   !== undefined ? priceHalfYear   : settings.priceHalfYear,
        priceYearly:     priceYearly     !== undefined ? priceYearly     : settings.priceYearly,
        pricingEnabled:  pricingEnabled  !== undefined ? pricingEnabled  : settings.pricingEnabled,
        pakasirApiKey:   pakasirApiKey   !== undefined ? pakasirApiKey   : settings.pakasirApiKey,
        pakasirSlug:     pakasirSlug     !== undefined ? pakasirSlug     : settings.pakasirSlug,
        pakasirSandbox:  pakasirSandbox  !== undefined ? pakasirSandbox  : settings.pakasirSandbox,
        pakasirEnabled:  pakasirEnabled  !== undefined ? pakasirEnabled  : settings.pakasirEnabled,
        googleClientId:     (googleClientId     !== undefined && googleClientId     !== "") ? googleClientId.trim()     : settings.googleClientId,
        googleClientSecret: (googleClientSecret !== undefined && googleClientSecret !== "") ? googleClientSecret.trim() : settings.googleClientSecret,
        driveTokenSecret:   (driveTokenSecret   !== undefined && driveTokenSecret   !== "") ? driveTokenSecret.trim()   : settings.driveTokenSecret,
      },
    });

    invalidateSystemSettingsCache();
    return successResponse(updated, "Pengaturan berhasil disimpan");
  } catch (error) {
    console.error("PUT /api/admin/system-settings error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}

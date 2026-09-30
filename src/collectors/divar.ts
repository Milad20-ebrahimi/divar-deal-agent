import axios from "axios";

export interface DivarConnectivityResult {
  ok: boolean;
  status?: number;
  contentType?: string;
  htmlLength?: number;
  preview?: string;
  error?: string;
}

export async function testDivarConnectivity(
  city = process.env.DIVAR_CITY || "tabriz",
): Promise<DivarConnectivityResult> {
  const url = `https://divar.ir/s/${encodeURIComponent(city)}`;

  try {
    const response = await axios.get<string>(url, {
      timeout: 15_000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8",
      },
      maxRedirects: 5,
      responseType: "text",
    });

    const html = String(response.data ?? "");

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      contentType: response.headers["content-type"],
      htmlLength: html.length,
      preview: html.slice(0, 300),
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        ok: false,
        status: error.response?.status,
        error: error.message,
      };
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  console.log("Connecting to Divar...");

  testDivarConnectivity().then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  });
}

import { All, Controller, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";

const POSTHOG_HOST = "https://eu.i.posthog.com";
const POSTHOG_ASSETS_HOST = "https://eu-assets.i.posthog.com";

@Controller("ph")
export class PosthogProxyController {
  @All("*path")
  async proxyAll(@Req() req: Request, @Res() res: Response) {
    const path =
      req.params["path"] || (req.params as unknown as string[]).join("/");
    const targetUrl = `${POSTHOG_HOST}/${path}${req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : ""}`;
    return this.proxyRequest(req, res, targetUrl);
  }

  @All("static/*path")
  async proxyStatic(@Req() req: Request, @Res() res: Response) {
    const path =
      req.params["path"] || (req.params as unknown as string[]).join("/");
    const targetUrl = `${POSTHOG_ASSETS_HOST}/static/${path}`;
    return this.proxyRequest(req, res, targetUrl);
  }

  private async proxyRequest(req: Request, res: Response, targetUrl: string) {
    try {
      const headers: Record<string, string> = {};

      // Forward relevant headers
      if (req.headers["content-type"]) {
        headers["content-type"] = req.headers["content-type"] as string;
      }
      if (req.headers["user-agent"]) {
        headers["user-agent"] = req.headers["user-agent"] as string;
      }

      const response = await fetch(targetUrl, {
        body:
          req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
        headers,
        method: req.method,
      });

      // Forward response headers
      response.headers.forEach((value, key) => {
        // Skip headers that shouldn't be forwarded
        if (
          !["connection", "content-encoding", "transfer-encoding"].includes(
            key.toLowerCase(),
          )
        ) {
          res.setHeader(key, value);
        }
      });

      res.status(response.status);

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        res.json(data);
      } else {
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      }
    } catch (error) {
      res
        .status(502)
        .json({
          error: "Proxy error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
    }
  }
}

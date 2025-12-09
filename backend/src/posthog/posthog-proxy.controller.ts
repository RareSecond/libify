import { All, Controller, Req, Res } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Request, Response } from "express";

const POSTHOG_HOST = "https://eu.i.posthog.com";
const POSTHOG_ASSETS_HOST = "https://eu-assets.i.posthog.com";

@ApiExcludeController()
@Controller("ph")
export class PosthogProxyController {
  @All("static/*")
  async proxyAllStatic(@Req() req: Request, @Res() res: Response) {
    // Extract path after /ph/static/
    const fullPath = req.originalUrl.replace(/^\/ph\/static\//, "");
    const [path, query] = fullPath.split("?");
    const targetUrl = `${POSTHOG_ASSETS_HOST}/static/${path}${query ? `?${query}` : ""}`;
    return this.proxyRequest(req, res, targetUrl);
  }

  @All("*")
  async proxyRest(@Req() req: Request, @Res() res: Response) {
    // Extract path after /ph/
    const fullPath = req.originalUrl.replace(/^\/ph\//, "");
    const [path, query] = fullPath.split("?");
    const targetUrl = `${POSTHOG_HOST}/${path}${query ? `?${query}` : ""}`;
    return this.proxyRequest(req, res, targetUrl);
  }

  private async proxyRequest(req: Request, res: Response, targetUrl: string) {
    try {
      // Extract the target host from the URL
      const targetHost = new URL(targetUrl).host;
      const headers: Record<string, string> = { host: targetHost };

      // Forward relevant headers
      const headersToForward = [
        "accept",
        "accept-encoding",
        "accept-language",
        "authorization",
        "content-type",
        "origin",
        "referer",
        "user-agent",
        "x-forwarded-for",
      ];

      for (const header of headersToForward) {
        if (req.headers[header]) {
          headers[header] = req.headers[header] as string;
        }
      }

      // Prepare body for non-GET/HEAD requests
      let body: Buffer | string | undefined;
      if (req.method !== "GET" && req.method !== "HEAD") {
        const contentType = req.headers["content-type"] || "";

        if (Buffer.isBuffer(req.body)) {
          // Raw body from express.raw() middleware (text/plain with gzip data)
          body = req.body;
        } else if (typeof req.body === "string") {
          body = req.body;
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          // Preserve form data format
          body = new URLSearchParams(
            req.body as Record<string, string>,
          ).toString();
        } else if (req.body && Object.keys(req.body).length > 0) {
          body = JSON.stringify(req.body);
        }
      }

      const response = await fetch(targetUrl, {
        body,
        headers,
        method: req.method,
        signal: AbortSignal.timeout(30000),
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

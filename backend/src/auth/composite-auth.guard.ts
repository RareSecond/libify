import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Composite auth guard that accepts either JWT (cookie) or API key authentication.
 * Tries JWT first (for web app), falls back to API key (for desktop/external clients).
 */
@Injectable()
export class CompositeAuthGuard extends AuthGuard(["jwt", "api-key"]) {
  handleRequest<TUser>(
    err: Error | null,
    user: false | TUser,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    // If either strategy succeeds, we have a user
    if (user) {
      return user;
    }

    // If both fail, throw the error from the last strategy
    return super.handleRequest(err, user, info, context, status);
  }
}

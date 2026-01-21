import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { User } from "@prisma/client";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as undefined | User;

    if (!user) {
      throw new ForbiddenException("Authentication required");
    }

    if (!user.isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    return true;
  }
}

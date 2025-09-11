import { Module } from '@nestjs/common';
import { InviteService } from '../domain/services/invite.service';
@Module({ providers:[InviteService], exports:[InviteService] })
export class InvitesModule {}

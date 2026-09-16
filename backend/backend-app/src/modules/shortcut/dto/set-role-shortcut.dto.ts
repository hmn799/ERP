import { IsBoolean } from 'class-validator';

export class SetRoleShortcutDto {
  @IsBoolean()
  isEnabled: boolean;
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";

import { AccountGroupService } from "./account-group.service";
import { CreateAccountGroupDto } from "./dto/create-account-group.dto";
import { UpdateAccountGroupDto } from "./dto/update-account-group.dto";

@Controller("account-groups")
export class AccountGroupController {
  constructor(
    private readonly accountGroupService: AccountGroupService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateAccountGroupDto,
  ) {
    return this.accountGroupService.create(dto);
  }

  @Get()
  findAll() {
    return this.accountGroupService.findAll();
  }

  @Get(":id")
  findOne(
    @Param("id") id: string,
  ) {
    return this.accountGroupService.findOne(id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateAccountGroupDto,
  ) {
    return this.accountGroupService.update(id, dto);
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
  ) {
    return this.accountGroupService.remove(id);
  }
}

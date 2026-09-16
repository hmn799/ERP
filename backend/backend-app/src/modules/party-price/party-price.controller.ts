import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { PartyPriceService } from './party-price.service';
import { CreatePartyPriceDto } from './dto/create-party-price.dto';
import { UpdatePartyPriceDto } from './dto/update-party-price.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('party-price')
export class PartyPriceController {
  constructor(
    private readonly partyPriceService: PartyPriceService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CHANGE_RATE')
  create(
    @Body() createPartyPriceDto: CreatePartyPriceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.partyPriceService.create(
      createPartyPriceDto,
      { id: user.sub, name: user.fullName || user.username },
    );
  }

  @Get()
  findAll() {
    return this.partyPriceService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.partyPriceService.findOne(id);
  }

  @Get('customer/:customerId')
  findByCustomer(
    @Param('customerId') customerId: string,
  ) {
    return this.partyPriceService.findByCustomer(customerId);
  }

  @Get('item/:itemId')
  findByItem(
    @Param('itemId') itemId: string,
  ) {
    return this.partyPriceService.findByItem(itemId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CHANGE_RATE')
  update(
    @Param('id') id: string,
    @Body() updatePartyPriceDto: UpdatePartyPriceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.partyPriceService.update(
      id,
      updatePartyPriceDto,
      { id: user.sub, name: user.fullName || user.username },
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.partyPriceService.remove(id);
  }
}
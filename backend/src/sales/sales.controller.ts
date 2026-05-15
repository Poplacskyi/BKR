import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: number; email: string };
}

@UseGuards(AuthGuard('jwt'))
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSaleDto: any, @Req() req: RequestWithUser) {
    return this.salesService.createSale(createSaleDto, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSaleDto: any,
    @Req() req: RequestWithUser,
  ) {
    return this.salesService.updateSale(+id, updateSaleDto, req.user.userId);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.salesService.findAllSales(req.user.userId);
  }
}

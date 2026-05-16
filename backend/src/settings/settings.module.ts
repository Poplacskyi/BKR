import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from './settings.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Settings])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService], // експортуємо — може знадобитись в інших модулях
})
export class SettingsModule {}

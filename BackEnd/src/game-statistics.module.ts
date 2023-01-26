import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameStatistic } from './game-statistic.entity';
import { GameStatisticsController } from './game-statistics.controller';
import { GameStatisticsServiceImpl } from './game-statistics.service.impl';

@Module({
  imports: [TypeOrmModule.forFeature([GameStatistic])],
  controllers: [GameStatisticsController],
  providers: [GameStatisticsServiceImpl],
})
export class GameStatisticssModule {}
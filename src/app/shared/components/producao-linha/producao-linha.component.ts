import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

import type { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([LineChart, GridComponent, CanvasRenderer]);

@Component({
  selector: 'app-producao-linha',
  imports: [NgxEchartsDirective],
  templateUrl: './producao-linha.component.html',
  styleUrl: './producao-linha.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideEchartsCore({ echarts }) // ✅ Aqui você passa a instância real
  ]
})
export class ProducaoLinhaComponent implements OnInit {

  options: EChartsCoreOption = {};

  ngOnInit(): void {
    const xAxisData = [];
    const data1 = [];
    const data2 = [];

    for (let i = 0; i < 100; i++) {
      xAxisData.push('category' + i);
      data1.push((Math.sin(i / 5) * (i / 5 - 10) + i / 6) * 5);
      data2.push((Math.cos(i / 5) * (i / 5 - 10) + i / 6) * 5);
    }

    this.options = {
      xAxis: {
        type: 'category',
        data: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          data: [0, 75, 80, 56, 64, 78, 90, 87, 17],
          type: 'line'
        }
      ]
    };
  }
}

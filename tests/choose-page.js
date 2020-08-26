const fetch = require('node-fetch');
const fs = require('fs');
const dotenv = require('dotenv');
const readline = require('readline-sync');
const path = require('path');


const timestamp = new Date().getTime();
const reportsPath = path.resolve(process.cwd(), './reports');
const performancePath = path.resolve(process.cwd(), './performance-data');

dotenv.config()

const api_key = process.env.PAGE_SPEED_INSIGHTS_API_KEY;

const page_data = {
  page_url: '',
  cruxMetrics: {
    first_contentful_paint: '',
    first_input_delay: '',
  },
  lighthouse_metrics: {
    first_contentful_paint: {
      value: null,
      label: 'ms', // => normally reported in s
    },
    speed_index: {
      value: null,
      label: 'ms', // => normally reported in s
    },
    time_to_interactive: {
      value: null,
      label: 'ms', // => normally reported in s
    },
    first_meaningful_paint: {
      value: null,
      label: 'ms', // => normally reported in s
    },
    first_cpu_idle: {
      value: null,
      label: 'ms', // => normally reported in s
    },
    estimated_input_latency: {
      value: null,
      label: 'ms',
    }
  }
};

function run() {
  if (!fs.existsSync(reportsPath)) {
    fs.mkdirSync(reportsPath);
  }
  
  let page_url = readline.question('What url would you like to test? ');
  let page_nickname = readline.question('What would you like to call this page? ');
  let times = parseInt(readline.question('How many times do you want to run the test? (Max of 10): '));
  console.log(`Okay, testing the ${page_nickname.toUpperCase()} page using url: ${page_url} ${times} times`)

  
  api_call(page_url, times)
    .then(() => {
      const cruxMetrics = {
        "First Contentful Paint": page_data.cruxMetrics.first_contentful_paint,
        "First Input Delay": page_data.cruxMetrics.first_input_delay
      };
  
      const lighthouseMetrics = {
        'First Contentful Paint': `${(page_data.lighthouse_metrics.first_contentful_paint.value / times).toFixed(2)} ${page_data.lighthouse_metrics.first_contentful_paint.label}`,
        'Speed Index': `${(page_data.lighthouse_metrics.speed_index.value / times).toFixed(2)} ${page_data.lighthouse_metrics.speed_index.label}`,
        'Time To Interactive': `${(page_data.lighthouse_metrics.time_to_interactive.value / times).toFixed(2)} ${page_data.lighthouse_metrics.time_to_interactive.label}`,
        'First Meaningful Paint': `${(page_data.lighthouse_metrics.first_meaningful_paint.value / times).toFixed(2)} ${page_data.lighthouse_metrics.first_meaningful_paint.label}`,
        'First CPU Idle': `${(page_data.lighthouse_metrics.first_cpu_idle.value / times).toFixed(2)} ${page_data.lighthouse_metrics.first_cpu_idle.label}`,
        'Estimated Input Latency': `${(page_data.lighthouse_metrics.estimated_input_latency.value / times).toFixed(2)} ${page_data.lighthouse_metrics.estimated_input_latency.label}`,
      };

      const lighthouseDataTotal = {
        'Times run': times,
        'First Contentful Paint': page_data.lighthouse_metrics.first_contentful_paint.value,
        'Speed Index':page_data.lighthouse_metrics.speed_index.value,
        'Time To Interactive': page_data.lighthouse_metrics.time_to_interactive.value,
        'First Meaningful Paint': page_data.lighthouse_metrics.first_meaningful_paint.value,
        'First CPU Idle': page_data.lighthouse_metrics.first_cpu_idle.value,
        'Estimated Input Latency': page_data.lighthouse_metrics.estimated_input_latency.value,
      };
  
      const initialContent = showInitialContent(page_data.page_url);
      const cruxMetricsContent = showCruxContent(cruxMetrics);
      const lighthouseContent = showLighthouseContent(lighthouseMetrics);
      const test_runner_content = `<h2>This was run ${times} times</h2>`;
      const finalContent = initialContent + cruxMetricsContent + lighthouseContent + test_runner_content;

      const performanceData = {'Page': page_nickname, 'total_data': lighthouseDataTotal, 'avg_data': lighthouseMetrics};

      fs.writeFileSync(reportsPath + '/' + page_nickname + '-psi-' + timestamp + '.html', finalContent);
      fs.writeFileSync(performancePath + '/' + page_nickname + '-performance-data-' + timestamp + '.json', JSON.stringify(performanceData));
      console.log(performanceData);
    });
}

const api_call =  async function (test_url, repeat) {
  let i = 0;
  do {
  const url = setUpQuery(test_url)
  await fetch(url)
    .then(response => response.json())
    .then(json => {
      page_data.page_url = json.id;
    
      switch(true) {
        case page_data.cruxMetrics.first_contentful_paint === 'FAST':
          page_data.cruxMetrics.first_contentful_paint = json.loadingExperience.metrics.FIRST_CONTENTFUL_PAINT_MS.category;
        case page_data.cruxMetrics.first_contentful_paint === 'AVERAGE' && json.loadingExperience.metrics.FIRST_CONTENTFUL_PAINT_MS.category === 'SLOW':
          page_data.cruxMetrics.first_contentful_paint = json.loadingExperience.metrics.FIRST_CONTENTFUL_PAINT_MS.category;
          break;
        case page_data.cruxMetrics.first_contentful_paint === 'AVERAGE' && json.loadingExperience.metrics.FIRST_CONTENTFUL_PAINT_MS.category === 'FAST':
        case page_data.cruxMetrics.first_contentful_paint === 'SLOW':
          break;
        default:
          page_data.cruxMetrics.first_contentful_paint = json.loadingExperience.metrics.FIRST_CONTENTFUL_PAINT_MS.category;
      }

      switch(true) {
        case page_data.cruxMetrics.first_input_delay === 'FAST':
          page_data.cruxMetrics.first_input_delay = json.loadingExperience.metrics.FIRST_INPUT_DELAY_MS.category;
        case page_data.cruxMetrics.first_input_delay === 'AVERAGE' && json.loadingExperience.metrics.FIRST_INPUT_DELAY_MS.category === 'SLOW':
          page_data.cruxMetrics.first_input_delay = json.loadingExperience.metrics.FIRST_INPUT_DELAY_MS.category;
          break;
        case page_data.cruxMetrics.first_input_delay === 'AVERAGE' && json.loadingExperience.metrics.FIRST_INPUT_DELAY_MS.category === 'FAST':
        case page_data.cruxMetrics.first_input_delay === 'SLOW':
          break;
        default:
          page_data.cruxMetrics.first_input_delay = json.loadingExperience.metrics.FIRST_INPUT_DELAY_MS.category;
      }

      const lighthouse = json.lighthouseResult;

      page_data.lighthouse_metrics.first_contentful_paint.value += lighthouse.audits['first-contentful-paint'].numericValue;
      page_data.lighthouse_metrics.speed_index.value += lighthouse.audits['speed-index'].numericValue;
      page_data.lighthouse_metrics.time_to_interactive.value += lighthouse.audits['interactive'].numericValue;
      page_data.lighthouse_metrics.first_meaningful_paint.value += lighthouse.audits['first-meaningful-paint'].numericValue;
      page_data.lighthouse_metrics.first_cpu_idle.value += lighthouse.audits['first-cpu-idle'].numericValue;
      page_data.lighthouse_metrics.estimated_input_latency.value += lighthouse.audits['estimated-input-latency'].numericValue;

      i++
    })
  }
  while (i < repeat)
}


function setUpQuery(testUrl) {
  const url = encodeURIComponent(testUrl);
  const api = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
  const parameters = {
    key: api_key,
    url
  };
  let query = `${api}?`;
  for (key in parameters) {
    if (Object.keys(parameters).indexOf(key) > 0) {
      query += '&'
    }
    query += `${key}=${parameters[key]}`;
  }
  return query;
}

function showInitialContent(id) {
  const htmlContent = `
    <h1>PageSpeed Insights API Demo</h1>
    <p>Page tested: ${id}</p>
  `;
  return htmlContent
}

function showCruxContent(cruxMetrics) {
  let htmlContent = `
    <h2>Chrome User Experience Report Results</h2>
  `
  for (key in cruxMetrics) {
    htmlContent += `<p>${key}: ${cruxMetrics[key]}</p>`;
  }
  return htmlContent;
}

function showLighthouseContent(lighthouseMetrics) {
  let htmlContent = `
    <h2>Lighthouse Results</h2>
  `
  for (key in lighthouseMetrics) {

    htmlContent += `<p>${key}: ${lighthouseMetrics[key]}</p>`;
  }
  return htmlContent;
}

run();
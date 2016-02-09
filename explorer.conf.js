
const config = {
  schema: 'phis_dq',
  //schema: 'pcornet_dq',
  dimsetset: 'data_element,issue_period,patient_type,hospital_name',
  toFetch: 'denorm',
  //toFetch: 'dimsetsets',
  schemaChoices: ['phis_dq', 'pcornet_dq', 'hospital_dq', 'ms_dq', 'synpuf_dq',],
};
const months = {
  'JAN': '01', 
  'FEB': '02',
  'MAR': '03',
  'APR': '04',
  'MAY': '05',
  'JUN': '06',
  'JUL': '07',
  'AUG': '08',
  'SEP': '09',
  'OCT': '10',
  'NOV': '11',
  'DEC': '12',
};
let dims;
switch (config.schema) {
  case 'phis_dq':
    dims = {
            all: {
              func:()=>'', field: 'all', name: 'All', hide: true,
            },
            issue_period: {
              field: 'issue_period', name: 'Period',
              sortBy: d=>d.toString(),
              role: 'x',
              dataType: 'ordinal'
            },
            data_element: {field: 'data_element', name: 'Data Element' },
            patient_type: {field: 'patient_type', name: 'Patient Type' },
            result_name: {field: 'result_name', name: 'Result Name' },
            hospital_name: {field: 'hospital_name', name: 'Hospital' },
            result_unit: {field: 'result_unit', name: 'Unit' },
            measure_name: {canAggregate: false, field: 'measure_name', 
              name: 'Measure Name', chart:true },
            /*
            element_measure: {
              field: 'element_measure', name: 'Element => Measure', 
              func: r=>r.data_element + ' => ' + r.measure_name,
              chart: true,
            },
            */
            /*
            value: {field: 'value', name: 'Value' },

            {field: 'measure_desc', name: 'Measure Description' },
            source_name: {field: 'source_name', name: 'Source' },

            */
          };
    break;
  case 'pcornet_dq':
    dims = {
            all: {
              func:()=>'', field: 'all', name: 'All', hide: true,
            },
            admit_date: {
              field: 'admit_date', name: 'Admit Date',
              func: d => {
                let m = d.admit_date.match(/(\d+)([A-Z]+)?/);
                return m && (m[1] + (m[2] ? `-${m[2]}` : '')) || d.admit_date;
              },
              sortBy: d=>d.toString(),
              role: 'x',
              dataType: 'ordinal'
            },
            enc_type: {field: 'enc_type', name: 'ENC_TYPE' },
            enctype: {field: 'enctype', name: 'ENCTYPE' },
            result_name: {field: 'result_name', name: 'Result Name' },
            measure_name: {canAggregate: false, field: 'measure_name', 
              name: 'Measure Name', chart:true },
            /*
            element_measure: {
              field: 'element_measure', name: 'Element => Measure', 
              func: r=>r.data_element + ' => ' + r.measure_name,
              chart: true,
            },
            */
            /*
            value: {field: 'value', name: 'Value' },

            {field: 'measure_desc', name: 'Measure Description' },
            source_name: {field: 'source_name', name: 'Source' },

            */
          };
    break;
}

export default function explorerconf() {
  return {
          config: config,
          dims: dims,
          //allDims: true,
        };
}

/**
 * CSI MasterFormat Divisions
 * Construction Specifications Institute standard divisions for organizing construction work
 */

export interface CSIDivision {
  code: string;
  name: string;
  description: string;
}

export const csiDivisions: CSIDivision[] = [
  {
    code: '00',
    name: 'Procurement and Contracting Requirements',
    description: 'Introductory information, bidding requirements, contracting requirements, and project forms'
  },
  {
    code: '01',
    name: 'General Requirements',
    description: 'Administrative, procedural, and temporary work requirements'
  },
  {
    code: '02',
    name: 'Existing Conditions',
    description: 'Subsurface investigation, demolition, structure moving, and site remediation'
  },
  {
    code: '03',
    name: 'Concrete',
    description: 'Concrete formwork, reinforcement, cast-in-place, and precast concrete'
  },
  {
    code: '04',
    name: 'Masonry',
    description: 'Brick, concrete block, stone, and mortar work'
  },
  {
    code: '05',
    name: 'Metals',
    description: 'Structural steel, metal joists, metal decking, and ornamental metals'
  },
  {
    code: '06',
    name: 'Wood, Plastics, and Composites',
    description: 'Rough carpentry, finish carpentry, and architectural woodwork'
  },
  {
    code: '07',
    name: 'Thermal and Moisture Protection',
    description: 'Waterproofing, insulation, roofing, and siding'
  },
  {
    code: '08',
    name: 'Openings',
    description: 'Doors, windows, skylights, and hardware'
  },
  {
    code: '09',
    name: 'Finishes',
    description: 'Gypsum board, tile, terrazzo, acoustical treatment, flooring, and painting'
  },
  {
    code: '10',
    name: 'Specialties',
    description: 'Visual display units, lockers, fire extinguishers, and flagpoles'
  },
  {
    code: '11',
    name: 'Equipment',
    description: 'Commercial, institutional, and residential equipment'
  },
  {
    code: '12',
    name: 'Furnishings',
    description: 'Window treatments, furniture, rugs, and artwork'
  },
  {
    code: '13',
    name: 'Special Construction',
    description: 'Special-purpose rooms, integrated construction, and special structures'
  },
  {
    code: '14',
    name: 'Conveying Equipment',
    description: 'Elevators, escalators, lifts, and material handling systems'
  },
  {
    code: '21',
    name: 'Fire Suppression',
    description: 'Fire protection piping, fire pumps, and fire suppression systems'
  },
  {
    code: '22',
    name: 'Plumbing',
    description: 'Plumbing piping, fixtures, domestic water, and sanitary waste'
  },
  {
    code: '23',
    name: 'Heating, Ventilating, and Air Conditioning (HVAC)',
    description: 'HVAC piping, ductwork, air distribution, and HVAC equipment'
  },
  {
    code: '25',
    name: 'Integrated Automation',
    description: 'Building automation, control systems, and integrated automation'
  },
  {
    code: '26',
    name: 'Electrical',
    description: 'Electrical service, power distribution, lighting, and communications'
  },
  {
    code: '27',
    name: 'Communications',
    description: 'Data networks, telecommunications, and audio-visual systems'
  },
  {
    code: '28',
    name: 'Electronic Safety and Security',
    description: 'Fire alarm, access control, video surveillance, and intrusion detection'
  },
  {
    code: '31',
    name: 'Earthwork',
    description: 'Site clearing, excavation, grading, and trenching'
  },
  {
    code: '32',
    name: 'Exterior Improvements',
    description: 'Paving, site development, landscaping, and irrigation'
  },
  {
    code: '33',
    name: 'Utilities',
    description: 'Water, sewer, gas, steam, and electrical site utilities'
  },
  {
    code: '34',
    name: 'Transportation',
    description: 'Roadway construction, rail track work, and pedestrian bridges'
  },
  {
    code: '35',
    name: 'Waterway and Marine Construction',
    description: 'Dredging, marine equipment, and waterway structures'
  },
  {
    code: '40',
    name: 'Process Integration',
    description: 'Process piping, process equipment, and industrial process systems'
  },
  {
    code: '41',
    name: 'Material Processing and Handling Equipment',
    description: 'Manufacturing and processing equipment'
  },
  {
    code: '42',
    name: 'Process Heating, Cooling, and Drying Equipment',
    description: 'Industrial heating and cooling systems'
  },
  {
    code: '43',
    name: 'Process Gas and Liquid Handling, Purification, and Storage Equipment',
    description: 'Industrial gas and liquid systems'
  },
  {
    code: '44',
    name: 'Pollution and Waste Control Equipment',
    description: 'Emissions control and waste treatment systems'
  },
  {
    code: '45',
    name: 'Industry-Specific Manufacturing Equipment',
    description: 'Specialized industrial manufacturing equipment'
  },
  {
    code: '48',
    name: 'Electrical Power Generation',
    description: 'Power generation equipment and renewable energy systems'
  }
];

/**
 * Get division by code
 */
export function getDivisionByCode(code: string): CSIDivision | undefined {
  return csiDivisions.find(d => d.code === code);
}

/**
 * Get commonly used divisions (for quick filters)
 */
export function getCommonDivisions(): CSIDivision[] {
  const commonCodes = ['02', '03', '04', '05', '06', '07', '08', '09', '21', '22', '23', '26', '28', '31', '32'];
  return csiDivisions.filter(d => commonCodes.includes(d.code));
}

/**
 * Group divisions by category
 */
export function getDivisionsByCategory() {
  return {
    general: csiDivisions.filter(d => ['00', '01'].includes(d.code)),
    sitework: csiDivisions.filter(d => ['02', '31', '32', '33', '34', '35'].includes(d.code)),
    structure: csiDivisions.filter(d => ['03', '04', '05'].includes(d.code)),
    enclosure: csiDivisions.filter(d => ['06', '07', '08'].includes(d.code)),
    interiors: csiDivisions.filter(d => ['09', '10', '11', '12'].includes(d.code)),
    mechanical: csiDivisions.filter(d => ['21', '22', '23', '25'].includes(d.code)),
    electrical: csiDivisions.filter(d => ['26', '27', '28'].includes(d.code)),
    special: csiDivisions.filter(d => ['13', '14'].includes(d.code)),
    process: csiDivisions.filter(d => parseInt(d.code) >= 40)
  };
}

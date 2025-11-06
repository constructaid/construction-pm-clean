/**
 * CSI MasterFormat 2020 - Construction Specifications Institute
 * Standard divisions for organizing construction specifications and estimates
 */

export interface CSIDivision {
  code: string;
  title: string;
  description: string;
  color: string;
}

export const CSI_DIVISIONS: CSIDivision[] = [
  {
    code: '00',
    title: 'Procurement and Contracting Requirements',
    description: 'Introductory information, bidding requirements, contracting requirements, and project forms',
    color: '#6B7280',
  },
  {
    code: '01',
    title: 'General Requirements',
    description: 'Administrative, procedural, and temporary facilities for construction',
    color: '#8B5CF6',
  },
  {
    code: '02',
    title: 'Existing Conditions',
    description: 'Assessment, remediation, and preparation of existing site conditions',
    color: '#EF4444',
  },
  {
    code: '03',
    title: 'Concrete',
    description: 'Cast-in-place concrete, precast concrete, and specialty concrete systems',
    color: '#F59E0B',
  },
  {
    code: '04',
    title: 'Masonry',
    description: 'Unit masonry, stone assemblies, and masonry restoration',
    color: '#D97706',
  },
  {
    code: '05',
    title: 'Metals',
    description: 'Structural metal framing, metal fabrications, and decorative metals',
    color: '#6366F1',
  },
  {
    code: '06',
    title: 'Wood, Plastics, and Composites',
    description: 'Rough carpentry, finish carpentry, architectural woodwork, and plastic fabrications',
    color: '#92400E',
  },
  {
    code: '07',
    title: 'Thermal and Moisture Protection',
    description: 'Waterproofing, insulation, roofing, siding, and sheet metal',
    color: '#06B6D4',
  },
  {
    code: '08',
    title: 'Openings',
    description: 'Doors, frames, windows, glazing, skylights, and hardware',
    color: '#3B82F6',
  },
  {
    code: '09',
    title: 'Finishes',
    description: 'Plaster, gypsum board, tiling, flooring, painting, and wall coverings',
    color: '#10B981',
  },
  {
    code: '10',
    title: 'Specialties',
    description: 'Lockers, signage, toilet partitions, and fireplaces',
    color: '#F97316',
  },
  {
    code: '11',
    title: 'Equipment',
    description: 'Commercial, institutional, and residential equipment',
    color: '#EC4899',
  },
  {
    code: '12',
    title: 'Furnishings',
    description: 'Furniture, window treatments, and interior plants',
    color: '#8B5CF6',
  },
  {
    code: '13',
    title: 'Special Construction',
    description: 'Pre-engineered structures, special purpose rooms, and integrated construction',
    color: '#EF4444',
  },
  {
    code: '14',
    title: 'Conveying Equipment',
    description: 'Elevators, escalators, lifts, and material handling systems',
    color: '#F59E0B',
  },
  {
    code: '21',
    title: 'Fire Suppression',
    description: 'Fire suppression systems, fire extinguishers, and fire pumps',
    color: '#DC2626',
  },
  {
    code: '22',
    title: 'Plumbing',
    description: 'Plumbing piping, fixtures, equipment, and specialty systems',
    color: '#0EA5E9',
  },
  {
    code: '23',
    title: 'HVAC',
    description: 'Heating, ventilation, air conditioning, and controls',
    color: '#06B6D4',
  },
  {
    code: '25',
    title: 'Integrated Automation',
    description: 'Building automation systems and integration',
    color: '#8B5CF6',
  },
  {
    code: '26',
    title: 'Electrical',
    description: 'Electrical distribution, lighting, communications, and low voltage systems',
    color: '#FBBF24',
  },
  {
    code: '27',
    title: 'Communications',
    description: 'Data, voice, security, and audio-visual systems',
    color: '#3B82F6',
  },
  {
    code: '28',
    title: 'Electronic Safety and Security',
    description: 'Fire alarm, security, access control, and monitoring systems',
    color: '#EF4444',
  },
  {
    code: '31',
    title: 'Earthwork',
    description: 'Site clearing, excavation, grading, and soil treatment',
    color: '#92400E',
  },
  {
    code: '32',
    title: 'Exterior Improvements',
    description: 'Paving, landscaping, site furnishings, and irrigation',
    color: '#10B981',
  },
  {
    code: '33',
    title: 'Utilities',
    description: 'Water, sanitary sewer, storm drainage, and utility distribution',
    color: '#06B6D4',
  },
];

export function getDivisionByCode(code: string): CSIDivision | undefined {
  return CSI_DIVISIONS.find(d => d.code === code);
}

export function getDivisionColor(code: string): string {
  const division = getDivisionByCode(code);
  return division?.color || '#6B7280';
}

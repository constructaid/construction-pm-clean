/**
 * Contact Extraction Service
 * Extracts contact information from emails, documents, and other communications
 */

export interface ExtractedContact {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneMain?: string;
  phoneMobile?: string;
  company?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  trade?: string;
  csiDivision?: string;
  confidence: number; // 0-100
  source: string;
}

/**
 * Extract email addresses from text
 */
export function extractEmails(text: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return text.match(emailRegex) || [];
}

/**
 * Extract phone numbers from text (various formats)
 */
export function extractPhoneNumbers(text: string): string[] {
  const phoneRegexes = [
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // (123) 456-7890 or 123-456-7890
    /\d{3}[-.\s]\d{4}/g, // 123-4567
    /1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // 1-123-456-7890
  ];

  const phones: string[] = [];
  for (const regex of phoneRegexes) {
    const matches = text.match(regex);
    if (matches) {
      phones.push(...matches);
    }
  }

  return [...new Set(phones)]; // Remove duplicates
}

/**
 * Extract addresses from text
 */
export function extractAddresses(text: string): Array<{
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}> {
  const addresses: Array<any> = [];

  // Look for patterns like: "123 Main St, Austin, TX 78701"
  const addressRegex = /(\d+\s+[A-Za-z0-9\s,]+),\s*([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5}(-\d{4})?)/g;
  let match;

  while ((match = addressRegex.exec(text)) !== null) {
    addresses.push({
      street: match[1]?.trim(),
      city: match[2]?.trim(),
      state: match[3]?.trim(),
      zipCode: match[4]?.trim(),
    });
  }

  return addresses;
}

/**
 * Extract company names from email signature
 */
export function extractCompanyFromSignature(text: string): string | null {
  // Look for common signature patterns
  const lines = text.split('\n').map(l => l.trim());

  // Look for lines that might be company names (usually after name, before contact info)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line) continue;

    // Skip lines that are clearly contact info
    if (line.includes('@') || line.match(/\d{3}[-.\s]\d{3}[-.\s]\d{4}/)) continue;

    // Skip common signature separators
    if (line.match(/^[-_=*]{3,}$/)) continue;

    // Company names often contain: Inc, LLC, Corp, Ltd, Co
    if (line.match(/\b(Inc\.|LLC|Corp\.|Ltd\.|Co\.|Company|Construction|Builders?|Contractors?|Services?)\b/i)) {
      return line;
    }
  }

  return null;
}

/**
 * Extract person name from email signature or text
 */
export function extractPersonName(text: string): { firstName?: string; lastName?: string; fullName?: string } | null {
  const lines = text.split('\n').map(l => l.trim());

  for (const line of lines) {
    // Skip empty or very short lines
    if (!line || line.length < 3) continue;

    // Skip lines with email or phone
    if (line.includes('@') || line.match(/\d{3}[-.\s]\d{3}[-.\s]\d{4}/)) continue;

    // Look for name pattern (2-3 words, capitalized)
    const nameMatch = line.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)(\s+[A-Z][a-z]+)?$/);
    if (nameMatch) {
      return {
        firstName: nameMatch[1],
        lastName: nameMatch[3] ? nameMatch[3].trim() : nameMatch[2],
        fullName: line,
      };
    }
  }

  return null;
}

/**
 * Extract title/position from signature
 */
export function extractTitle(text: string): string | null {
  const titleKeywords = [
    'Project Manager',
    'Superintendent',
    'Foreman',
    'President',
    'Vice President',
    'Owner',
    'Director',
    'Engineer',
    'Architect',
    'Estimator',
    'Sales',
    'Account Manager',
    'Operations Manager',
  ];

  for (const keyword of titleKeywords) {
    const regex = new RegExp(keyword, 'i');
    if (regex.test(text)) {
      // Try to extract the full title line
      const lines = text.split('\n');
      for (const line of lines) {
        if (regex.test(line)) {
          return line.trim();
        }
      }
    }
  }

  return null;
}

/**
 * Determine trade/specialty from text
 */
export function extractTrade(text: string): { trade?: string; csiDivision?: string } | null {
  const tradeMappings = [
    { keywords: ['concrete', 'ready-mix', 'rebar'], trade: 'Concrete', division: '03' },
    { keywords: ['masonry', 'brick', 'block', 'stone'], trade: 'Masonry', division: '04' },
    { keywords: ['steel', 'metal', 'structural'], trade: 'Metals', division: '05' },
    { keywords: ['carpentry', 'framing', 'lumber', 'wood'], trade: 'Carpentry', division: '06' },
    { keywords: ['roofing', 'waterproofing', 'insulation'], trade: 'Roofing', division: '07' },
    { keywords: ['doors', 'windows', 'glazing', 'glass'], trade: 'Openings', division: '08' },
    { keywords: ['paint', 'drywall', 'flooring', 'tile', 'ceiling'], trade: 'Finishes', division: '09' },
    { keywords: ['plumbing', 'pipe', 'fixture'], trade: 'Plumbing', division: '22' },
    { keywords: ['hvac', 'mechanical', 'heating', 'cooling', 'ventilation'], trade: 'HVAC', division: '23' },
    { keywords: ['electrical', 'lighting', 'power', 'panel'], trade: 'Electrical', division: '26' },
    { keywords: ['fire alarm', 'security', 'low voltage'], trade: 'Fire Alarm', division: '28' },
    { keywords: ['excavation', 'earthwork', 'grading', 'demolition'], trade: 'Earthwork', division: '31' },
    { keywords: ['paving', 'asphalt', 'landscaping', 'site work'], trade: 'Site Work', division: '32' },
  ];

  const lowerText = text.toLowerCase();

  for (const mapping of tradeMappings) {
    for (const keyword of mapping.keywords) {
      if (lowerText.includes(keyword)) {
        return {
          trade: mapping.trade,
          csiDivision: mapping.division,
        };
      }
    }
  }

  return null;
}

/**
 * Extract contact from email message
 */
export function extractContactFromEmail(emailData: {
  from: string;
  subject: string;
  body: string;
  signature?: string;
}): ExtractedContact | null {
  const { from, subject, body, signature } = emailData;

  const textToAnalyze = signature || body;
  const contact: ExtractedContact = {
    confidence: 50,
    source: 'email',
  };

  // Extract email from 'from' field
  const fromEmail = extractEmails(from)[0];
  if (fromEmail) {
    contact.email = fromEmail;
    contact.confidence += 20;
  }

  // Extract name from 'from' field (format: "John Doe <john@example.com>")
  const nameMatch = from.match(/^([^<]+)</);
  if (nameMatch) {
    const fullName = nameMatch[1].trim();
    contact.fullName = fullName;
    const nameParts = fullName.split(' ');
    if (nameParts.length >= 2) {
      contact.firstName = nameParts[0];
      contact.lastName = nameParts[nameParts.length - 1];
      contact.confidence += 10;
    }
  }

  // Extract additional info from signature or body
  const phones = extractPhoneNumbers(textToAnalyze);
  if (phones.length > 0) {
    contact.phoneMain = phones[0];
    if (phones.length > 1) contact.phoneMobile = phones[1];
    contact.confidence += 10;
  }

  const company = extractCompanyFromSignature(textToAnalyze);
  if (company) {
    contact.company = company;
    contact.confidence += 15;
  }

  const title = extractTitle(textToAnalyze);
  if (title) {
    contact.title = title;
    contact.confidence += 5;
  }

  const addresses = extractAddresses(textToAnalyze);
  if (addresses.length > 0) {
    const addr = addresses[0];
    contact.address = addr.street;
    contact.city = addr.city;
    contact.state = addr.state;
    contact.zipCode = addr.zipCode;
    contact.confidence += 10;
  }

  // Determine trade from subject or body
  const tradeInfo = extractTrade(subject + ' ' + body);
  if (tradeInfo) {
    contact.trade = tradeInfo.trade;
    contact.csiDivision = tradeInfo.csiDivision;
    contact.confidence += 10;
  }

  // Only return if we have at least email or (name and company)
  if (contact.email || (contact.fullName && contact.company)) {
    return contact;
  }

  return null;
}

/**
 * Extract contacts from document text (RFI, Submittal, etc.)
 */
export function extractContactsFromDocument(documentText: string, documentType: string): ExtractedContact[] {
  const contacts: ExtractedContact[] = [];

  // Split by common section headers
  const sections = documentText.split(/\n(?=From:|To:|CC:|Prepared by:|Submitted by:)/i);

  for (const section of sections) {
    const emails = extractEmails(section);
    const phones = extractPhoneNumbers(section);
    const name = extractPersonName(section);
    const company = extractCompanyFromSignature(section);

    if (emails.length > 0 || name) {
      const contact: ExtractedContact = {
        source: documentType,
        confidence: 40,
      };

      if (emails.length > 0) {
        contact.email = emails[0];
        contact.confidence += 20;
      }

      if (name) {
        contact.firstName = name.firstName;
        contact.lastName = name.lastName;
        contact.fullName = name.fullName;
        contact.confidence += 15;
      }

      if (company) {
        contact.company = company;
        contact.confidence += 15;
      }

      if (phones.length > 0) {
        contact.phoneMain = phones[0];
        contact.confidence += 10;
      }

      contacts.push(contact);
    }
  }

  return contacts;
}

/**
 * Merge duplicate contacts based on email or name+company
 */
export function mergeDuplicateContacts(contacts: ExtractedContact[]): ExtractedContact[] {
  const merged: Map<string, ExtractedContact> = new Map();

  for (const contact of contacts) {
    // Create a unique key based on email or name+company
    let key = contact.email?.toLowerCase();
    if (!key && contact.fullName && contact.company) {
      key = `${contact.fullName.toLowerCase()}_${contact.company.toLowerCase()}`;
    }

    if (!key) continue;

    if (merged.has(key)) {
      // Merge with existing contact, keeping highest confidence data
      const existing = merged.get(key)!;
      merged.set(key, {
        ...existing,
        ...contact,
        confidence: Math.max(existing.confidence, contact.confidence),
      });
    } else {
      merged.set(key, contact);
    }
  }

  return Array.from(merged.values());
}

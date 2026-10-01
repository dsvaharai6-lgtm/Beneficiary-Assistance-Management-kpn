import { Family, FamilyMember, AssistanceRecord, Need, QRChangeRequest, User } from '../types';

export const OLD_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbzbfOEJuI00Rkg5dg18mpPRKJN5j4-r2uKyK7hM2EUKmL3n417m14MxOTnQuplJ_GyzMw/exec';

export const DEFAULT_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbwXq8eu64XQWsJVUONZsEQijtgH26qE_JqzwQwI_dZPnA8BdzEchinHRwEuIRgzNM85WQ/exec';

export type CloudPayload = Record<string, any>;

export const safeJsonParse = <T,>(value: any, fallback: T): T => {
  if (value === null || value === undefined || value === '') return fallback;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
};

export const getEffectiveWebAppUrl = (): string => {
  const saved = localStorage.getItem('bams_apps_script_url');
  if (saved && saved.trim() && saved.trim() !== OLD_WEB_APP_URL) {
    return saved.trim();
  }
  localStorage.setItem('bams_apps_script_url', DEFAULT_WEB_APP_URL);
  return DEFAULT_WEB_APP_URL;
};

export const setEffectiveWebAppUrl = (url: string): void => {
  localStorage.setItem('bams_apps_script_url', url.trim());
};

export const sendDataToGoogleCloud = async (payload: CloudPayload): Promise<boolean> => {
  try {
    const url = getEffectiveWebAppUrl();
    if (!url) throw new Error('Cloud web app URL is missing.');
    const action = String(payload.action ?? '').trim();
    if (!action) throw new Error('Cloud action is missing.');

    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: action,
        id: String(payload.id ?? payload.Family_ID ?? payload.Member_ID ?? payload.Assistance_ID ?? payload.Need_ID ?? payload.Request_ID ?? payload.User_ID ?? ''),
        QR_Number: String(payload.QR_Number ?? ''),
        Family_Name: String(payload.Family_Name ?? ''),
        Division_Name: String(payload.Division_Name ?? payload.Division ?? ''),
        Program_Name: String(payload.Program_Name ?? ''),
        Amount: payload.Amount ?? 0,
        Assistance_Type: String(payload.Assistance_Type ?? ''),
        User_ID: String(payload.User_ID ?? ''),
        Name: String(payload.Name ?? ''),
        Role: String(payload.Role ?? ''),
        Status: String(payload.Status ?? ''),
        timestamp: new Date().toISOString(),
        extraData: payload.extraData ?? payload,
        ...payload
      }),
    });
    return true;
  } catch (error) {
    console.error('Google Cloud sync error:', error);
    return false;
  }
};

export const fetchCloudData = async (): Promise<any> => {
  try {
    const url = getEffectiveWebAppUrl();
    if (!url) throw new Error('No Apps Script Web App URL configured.');
    const response = await fetch(`${url}?type=get_all&t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Google Cloud fetch error:', error);
    throw error;
  }
};

export const findExtraData = (row: any[]): Record<string, any> => {
  if (!Array.isArray(row)) return {};
  for (let i = row.length - 1; i >= 0; i--) {
    const val = row[i];
    if (typeof val === 'string' && val.trim().startsWith('{')) {
      const p = safeJsonParse<Record<string, any>>(val, {});
      if (p && typeof p === 'object' && Object.keys(p).length > 0) {
        return p;
      }
    }
  }
  return {};
};

export const normalizeFamily = (data: any): Family | null => {
  if (!data) return null;
  if (Array.isArray(data)) {
    const extra = findExtraData(data);
    const id = String(extra.Family_ID ?? data[0] ?? '');
    const qr = String(extra.QR_Number ?? data[1] ?? '').trim().toUpperCase();
    if (!qr && !id) return null;
    return {
      Family_ID: id || `FAM-${Date.now()}`,
      QR_Number: qr,
      Division_ID: String(extra.Division_ID ?? data[2] ?? 'GN001'),
      Division_Name: String(extra.Division_Name ?? data[3] ?? 'Panichchankerni'),
      Family_Name: String(extra.Family_Name ?? data[4] ?? 'Household ' + qr),
      Address: String(extra.Address ?? data[5] ?? ''),
      Telephone: String(extra.Telephone ?? data[6] ?? ''),
      Family_Size: Number(extra.Family_Size ?? data[7] ?? 1),
      Monthly_Income: Number(extra.Monthly_Income ?? data[8] ?? 0),
      Housing_Status: (extra.Housing_Status ?? data[9] ?? 'Own permanent') as any,
      Priority_Level: (extra.Priority_Level ?? data[10] ?? 'Normal') as any,
      Status: (extra.Status ?? data[11] ?? 'Active') as any,
      Created_By: String(extra.Created_By ?? data[12] ?? 'cloud'),
      Created_At: String(extra.Created_At ?? data[13] ?? new Date().toISOString()),
      Updated_By: String(extra.Updated_By ?? data[14] ?? 'cloud'),
      Updated_At: String(extra.Updated_At ?? data[15] ?? new Date().toISOString()),
      is_female_headed: Boolean(extra.is_female_headed ?? (data[16] === 'YES' || data[16] === true)),
      no_toilet: Boolean(extra.no_toilet ?? (data[17] === 'YES' || data[17] === true)),
      no_drinking_water_well: Boolean(extra.no_drinking_water_well ?? (data[18] === 'YES' || data[18] === true)),
      no_house: Boolean(extra.no_house ?? (data[19] === 'YES' || data[19] === true)),
      vulnerability: extra.vulnerability
    };
  }
  if (typeof data === 'object') {
    const qr = String(data.QR_Number ?? data.qrNumber ?? '').trim().toUpperCase();
    if (!qr && !data.Family_ID) return null;
    return {
      Family_ID: String(data.Family_ID ?? `FAM-${Date.now()}`),
      QR_Number: qr,
      Division_ID: String(data.Division_ID ?? 'GN001'),
      Division_Name: String(data.Division_Name ?? 'Panichchankerni'),
      Family_Name: String(data.Family_Name ?? 'Household ' + qr),
      Address: String(data.Address ?? ''),
      Telephone: String(data.Telephone ?? ''),
      Family_Size: Number(data.Family_Size ?? 1),
      Monthly_Income: Number(data.Monthly_Income ?? 0),
      Housing_Status: data.Housing_Status ?? 'Own permanent',
      Priority_Level: data.Priority_Level ?? 'Normal',
      Status: data.Status ?? 'Active',
      Created_By: String(data.Created_By ?? 'cloud'),
      Created_At: String(data.Created_At ?? new Date().toISOString()),
      Updated_By: String(data.Updated_By ?? 'cloud'),
      Updated_At: String(data.Updated_At ?? new Date().toISOString()),
      is_female_headed: Boolean(data.is_female_headed),
      no_toilet: Boolean(data.no_toilet),
      no_drinking_water_well: Boolean(data.no_drinking_water_well),
      no_house: Boolean(data.no_house),
      vulnerability: data.vulnerability
    };
  }
  return null;
};

export const normalizeMember = (data: any): FamilyMember | null => {
  if (!data) return null;
  if (Array.isArray(data)) {
    const extra = findExtraData(data);
    const id = String(extra.Member_ID ?? data[0] ?? '');
    const qr = String(extra.QR_Number ?? data[1] ?? '').trim().toUpperCase();
    const nic = String(extra.NIC_Elder_ID ?? data[2] ?? '').trim();
    if (!nic && !id) return null;
    return {
      Member_ID: id || `MEM-${Date.now()}`,
      QR_Number: qr,
      NIC_Elder_ID: nic,
      Name: String(extra.Name ?? data[3] ?? 'Member'),
      Relationship: String(extra.Relationship ?? data[4] ?? 'Member'),
      DOB: String(extra.DOB ?? data[5] ?? ''),
      Gender: (extra.Gender ?? data[6] ?? 'Male') as any,
      Occupation: String(extra.Occupation ?? data[7] ?? ''),
      Monthly_Income: Number(extra.Monthly_Income ?? data[8] ?? 0),
      Education: String(extra.Education ?? data[9] ?? ''),
      Calculated_Age: Number(extra.Calculated_Age ?? data[10] ?? 0),
      Disability: (extra.Disability ?? data[11] ?? 'No') as any,
      Disability_Type: extra.Disability_Type ?? data[12],
      Disability_Device_Needed: extra.Disability_Device_Needed ?? data[13],
      Disability_Allowance: extra.Disability_Allowance ?? data[14],
      Elderly: (extra.Elderly ?? data[15] ?? 'No') as any,
      Elderly_Allowance: extra.Elderly_Allowance ?? data[16],
      Elderly_Allowance_Amount: extra.Elderly_Allowance_Amount ?? data[17],
      Status: (extra.Status ?? data[18] ?? 'Active') as any,
      Created_By: String(extra.Created_By ?? data[19] ?? 'cloud'),
      Created_At: String(extra.Created_At ?? data[20] ?? new Date().toISOString()),
      Updated_By: String(extra.Updated_By ?? data[21] ?? 'cloud'),
      Updated_At: String(extra.Updated_At ?? data[22] ?? new Date().toISOString()),
    };
  }
  if (typeof data === 'object') {
    const nic = String(data.NIC_Elder_ID ?? data.nic ?? '').trim();
    if (!nic && !data.Member_ID) return null;
    return {
      Member_ID: String(data.Member_ID ?? `MEM-${Date.now()}`),
      QR_Number: String(data.QR_Number ?? '').trim().toUpperCase(),
      NIC_Elder_ID: nic,
      Name: String(data.Name ?? ''),
      Relationship: String(data.Relationship ?? 'Member'),
      DOB: String(data.DOB ?? ''),
      Gender: data.Gender ?? 'Male',
      Occupation: String(data.Occupation ?? ''),
      Monthly_Income: Number(data.Monthly_Income ?? 0),
      Education: String(data.Education ?? ''),
      Calculated_Age: Number(data.Calculated_Age ?? 0),
      Disability: data.Disability ?? 'No',
      Disability_Type: data.Disability_Type,
      Disability_Device_Needed: data.Disability_Device_Needed,
      Disability_Allowance: data.Disability_Allowance,
      Elderly: data.Elderly ?? 'No',
      Elderly_Allowance: data.Elderly_Allowance,
      Elderly_Allowance_Amount: data.Elderly_Allowance_Amount,
      Status: data.Status ?? 'Active',
      Created_By: String(data.Created_By ?? 'cloud'),
      Created_At: String(data.Created_At ?? new Date().toISOString()),
      Updated_By: String(data.Updated_By ?? 'cloud'),
      Updated_At: String(data.Updated_At ?? new Date().toISOString())
    };
  }
  return null;
};

export const normalizeAssistance = (data: any): AssistanceRecord | null => {
  if (!data) return null;
  if (Array.isArray(data)) {
    const extra = findExtraData(data);
    const id = String(extra.Assistance_ID ?? data[0] ?? '');
    const qr = String(extra.QR_Number ?? data[1] ?? '').trim().toUpperCase();
    if (!id && !qr) return null;
    return {
      Assistance_ID: id || `AST-${Date.now()}`,
      QR_Number: qr,
      Member_ID: String(extra.Member_ID ?? data[2] ?? ''),
      Program_ID: String(extra.Program_ID ?? data[3] ?? 'PRG001'),
      Program_Name: String(extra.Program_Name ?? data[4] ?? 'Assistance Program'),
      Assistance_Type: (extra.Assistance_Type ?? data[5] ?? 'Goods/In-kind') as any,
      Description: String(extra.Description ?? data[6] ?? ''),
      Amount: Number(extra.Amount ?? data[7] ?? 0),
      Quantity: Number(extra.Quantity ?? data[8] ?? 1),
      Unit: String(extra.Unit ?? data[9] ?? 'Unit'),
      Assistance_Date: String(extra.Assistance_Date ?? data[10] ?? new Date().toISOString().substring(0, 10)),
      Provided_By: String(extra.Provided_By ?? data[11] ?? 'officer01'),
      Status: (extra.Status ?? data[12] ?? 'Provided') as any,
      Remarks: String(extra.Remarks ?? data[13] ?? ''),
      Created_At: String(extra.Created_At ?? data[14] ?? new Date().toISOString())
    };
  }
  if (typeof data === 'object') {
    const id = String(data.Assistance_ID ?? '');
    const qr = String(data.QR_Number ?? '').trim().toUpperCase();
    if (!id && !qr) return null;
    return {
      Assistance_ID: id || `AST-${Date.now()}`,
      QR_Number: qr,
      Member_ID: String(data.Member_ID ?? ''),
      Program_ID: String(data.Program_ID ?? 'PRG001'),
      Program_Name: String(data.Program_Name ?? 'Assistance Program'),
      Assistance_Type: data.Assistance_Type ?? 'Goods/In-kind',
      Description: String(data.Description ?? ''),
      Amount: Number(data.Amount ?? 0),
      Quantity: Number(data.Quantity ?? 1),
      Unit: String(data.Unit ?? 'Unit'),
      Assistance_Date: String(data.Assistance_Date ?? new Date().toISOString().substring(0, 10)),
      Provided_By: String(data.Provided_By ?? 'officer01'),
      Status: data.Status ?? 'Provided',
      Remarks: String(data.Remarks ?? ''),
      Created_At: String(data.Created_At ?? new Date().toISOString())
    };
  }
  return null;
};

export const normalizeUser = (data: any): User | null => {
  if (!data) return null;
  if (Array.isArray(data)) {
    const extra = findExtraData(data);
    const uid = String(extra.User_ID ?? data[0] ?? '').trim();
    if (!uid) return null;
    return {
      User_ID: uid,
      Password: String(extra.Password ?? data[1] ?? ''),
      Name: String(extra.Name ?? data[2] ?? uid),
      Role: (extra.Role ?? data[3] ?? 'GN Officer') as any,
      Division: String(extra.Division ?? data[4] ?? 'ALL'),
      Status: (extra.Status ?? data[5] ?? 'Active') as any,
      Created_At: String(extra.Created_At ?? new Date().toISOString()),
      Last_Login: extra.Last_Login
    };
  }
  if (typeof data === 'object') {
    const uid = String(data.User_ID ?? '').trim();
    if (!uid) return null;
    return {
      User_ID: uid,
      Password: String(data.Password ?? ''),
      Name: String(data.Name ?? uid),
      Role: data.Role ?? 'GN Officer',
      Division: String(data.Division ?? 'ALL'),
      Status: data.Status ?? 'Active',
      Created_At: String(data.Created_At ?? new Date().toISOString()),
      Last_Login: data.Last_Login
    };
  }
  return null;
};

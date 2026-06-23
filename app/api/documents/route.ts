import { NextRequest, NextResponse } from 'next/server';
import { databaseConnect } from '@/lib/db';
import { verifyToken } from '@/utils/jwt';
import { RowDataPacket } from 'mysql2';

interface ProfileRow extends RowDataPacket {
  id: number;
}

interface DocumentRow extends RowDataPacket {
  id: number;
  document_type: string;
  file_path: string;
  uploaded_at: string | Date;
}

interface DocumentStateResponse {
  idCard: { name: string; size: string; uploadedAt: string } | null;
  schufa: { name: string; size: string; uploadedAt: string } | null;
  tenantSelfDisclosure: { name: string; size: string; uploadedAt: string } | null;
}

const typeToDbType: Record<string, string> = {
  idCard: 'ID_CARD',
  schufa: 'SHUFA',
  tenantSelfDisclosure: 'INCOME_STATEMENT',
  ID_CARD: 'ID_CARD',
  SHUFA: 'SHUFA',
  INCOME_STATEMENT: 'INCOME_STATEMENT',
};

const dbTypeToUiKey: Record<string, keyof DocumentStateResponse> = {
  ID_CARD: 'idCard',
  SHUFA: 'schufa',
  INCOME_STATEMENT: 'tenantSelfDisclosure',
};

function formatUploadedAt(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Today';
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function getUserProfileIdOrResponse(request: NextRequest): Promise<number | NextResponse> {
  const token = request.cookies.get('session_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const [profiles] = await databaseConnect.execute<ProfileRow[]>(
    'SELECT id FROM profiles WHERE user_id = ? LIMIT 1',
    [payload.userId]
  );

  if (!profiles.length) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return profiles[0].id;
}

export async function GET(request: NextRequest) {
  try {
    const profileIdOrResponse = await getUserProfileIdOrResponse(request);
    if (profileIdOrResponse instanceof NextResponse) {
      return profileIdOrResponse;
    }

    const profileId = profileIdOrResponse;

    const [documents] = await databaseConnect.execute<DocumentRow[]>(
      `
        SELECT id, document_type, file_path, uploaded_at
        FROM documents
        WHERE profile_id = ?
        ORDER BY uploaded_at DESC
      `,
      [profileId]
    );

    const documentState: DocumentStateResponse = {
      idCard: null,
      schufa: null,
      tenantSelfDisclosure: null,
    };

    for (const document of documents) {
      const uiKey = dbTypeToUiKey[document.document_type];
      if (!uiKey || documentState[uiKey]) {
        continue;
      }

      const nameFromPath = document.file_path.split('/').pop() || `${document.document_type}.pdf`;
      documentState[uiKey] = {
        name: nameFromPath,
        size: 'PDF',
        uploadedAt: formatUploadedAt(document.uploaded_at),
      };
    }

    return NextResponse.json({ documents: documentState }, { status: 200 });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}





export async function POST(request: NextRequest) {
  try {
    const profileIdOrResponse = await getUserProfileIdOrResponse(request);
    if (profileIdOrResponse instanceof NextResponse) {
      return profileIdOrResponse;
    }

    const profileId = profileIdOrResponse;
    const body = await request.json();

    const documentTypeInput = typeof body.documentType === 'string' ? body.documentType : '';
    const dbDocumentType = typeToDbType[documentTypeInput];

    if (!dbDocumentType) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    const filePath = `/mock/${dbDocumentType.toLowerCase()}.pdf`;

    await databaseConnect.execute(
      `
        INSERT INTO documents (profile_id, document_type, file_path, uploaded_at)
        VALUES (?, ?, ?, NOW())
      `,
      [profileId, dbDocumentType, filePath]
    );

    return NextResponse.json({ message: 'Document uploaded successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error uploading the documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
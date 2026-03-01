import type { DebateTopicExternal } from '@/core/types/debate-topic';

interface Props {
  external: DebateTopicExternal;
}

export default function ExternalReferences({ external }: Props) {
  if (!external.wikipediaUrl && !external.deweyDecimal && !external.locSubjectHeading && !external.stanfordUrl) {
    return null;
  }

  return (
    <div className="border border-gray-300 p-4 bg-gray-50 mb-4 text-sm text-right">
      <strong>External References:</strong>
      <br />
      {external.wikipediaUrl && (
        <>
          🌐 <strong>Wikipedia:</strong>{' '}
          <a href={external.wikipediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {external.wikipediaUrl}
          </a>
          <br />
        </>
      )}
      {external.deweyDecimal && (
        <>
          📚 <strong>Dewey Decimal:</strong> {external.deweyDecimal}
          <br />
        </>
      )}
      {external.locSubjectHeading && (
        <>
          🗂️ <strong>Library of Congress:</strong>{' '}
          {external.locUrl ? (
            <a href={external.locUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {external.locSubjectHeading}
            </a>
          ) : (
            external.locSubjectHeading
          )}
          <br />
        </>
      )}
      {external.stanfordUrl && (
        <>
          📖 <strong>Stanford Encyclopedia of Philosophy:</strong>{' '}
          <a href={external.stanfordUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {external.stanfordUrl.split('/entries/')[1]?.replace(/\//g, '') || 'Entry'}
          </a>
        </>
      )}
    </div>
  );
}

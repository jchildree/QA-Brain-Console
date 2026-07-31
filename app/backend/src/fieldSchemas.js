const FIELD_SCHEMAS = {
  sop: 'department (one of QC, QA, IT, Operations), tags (array of strings), purpose (short string), scope (short string)',
  cap: 'department (one of QC, QA, IT, Operations), tags (array of strings), root_cause (short string), effectiveness_status (one of Pending, Pass, Fail, N/A)',
  incident: 'department (one of QC, QA, IT, Operations), tags (array of strings), description (short string), detection_method (short string)',
  change: 'department (one of QC, QA, IT, Operations), tags (array of strings), change_description (short string), reason_for_change (short string)',
  audit: 'department (one of QC, QA, IT, Operations), tags (array of strings), audit_type (one of Internal, External, Supplier), scope (short string)',
  training: 'department (one of QC, QA, IT, Operations), tags (array of strings), employee_name (short string), role (short string)',
  meeting: 'department (one of QC, QA, IT, Operations), tags (array of strings), attendees (array of strings), meeting_date (date string YYYY-MM-DD)',
};

// Fields every record type shares, extracted the same way regardless of type
// -- kept separate from FIELD_SCHEMAS so this guidance isn't duplicated six
// times over.
const UNIVERSAL_FIELDS =
  'title (short string, plain text with no markdown syntax -- if the text has no explicit title, use the first heading, the first line, an ALL CAPS line, or bolded text near the top as the title, stripping any leading #, *, or other markdown markers from it), ' +
  'status (one of Draft, In Review, Approved, Obsolete -- default to Draft unless the text explicitly states its own status), ' +
  'version (short string, e.g. "v1" -- default to "v1" unless the text explicitly states its own version), ' +
  'related_documents (array of document id strings this text references or is related to, e.g. SOP-20260101-001, CAP-20260101-001, INC-20260101-001, CHG-20260101-001, AUD-20260101-001, TRN-20260101-001, MTG-20260101-001, NOTE-20260101-001 -- include an id even if you are not sure a record with that id exists yet)';

module.exports = { FIELD_SCHEMAS, UNIVERSAL_FIELDS };

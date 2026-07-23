const FIELD_SCHEMAS = {
  sop: 'department (one of QC, QA, IT, Operations), tags (array of strings), purpose (short string), scope (short string)',
  cap: 'department (one of QC, QA, IT, Operations), tags (array of strings), root_cause (short string), effectiveness_status (one of Pending, Pass, Fail, N/A)',
  incident: 'department (one of QC, QA, IT, Operations), tags (array of strings), description (short string), detection_method (short string)',
  change: 'department (one of QC, QA, IT, Operations), tags (array of strings), change_description (short string), reason_for_change (short string)',
  audit: 'department (one of QC, QA, IT, Operations), tags (array of strings), audit_type (one of Internal, External, Supplier), scope (short string)',
  training: 'department (one of QC, QA, IT, Operations), tags (array of strings), employee_name (short string), role (short string)',
};

module.exports = { FIELD_SCHEMAS };

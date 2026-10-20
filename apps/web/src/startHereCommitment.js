// Preserve the server's v1 field order and explicit nulls, including native
// artifacts whose Codable encoder omitted optional null-valued properties.
function object(value, required, nullable = []) {
  if (!value || Array.isArray(value) || typeof value !== 'object'
    || Object.keys(value).some(key => !required.includes(key) && !nullable.includes(key))
    || required.some(key => !Object.hasOwn(value,key))) throw new Error('Invalid committed Start Here package.');
  return value;
}
const text = value => { if (typeof value !== 'string') throw new Error('Invalid committed text.'); return value; };
const optionalText = value => value == null ? null : text(value);
export function committedStartHereJSON(value) {
  object(value,['schemaVersion','planner','plan','matters','trustedContacts','directionsNotPasswords','legalAuthorityNotGranted'],['audience']);
  if (value.schemaVersion !== 'start-here-v1' || value.directionsNotPasswords !== true || value.legalAuthorityNotGranted !== true
    || !Array.isArray(value.matters) || value.matters.length > 500
    || !Array.isArray(value.trustedContacts) || value.trustedContacts.length > 200) throw new Error('Invalid committed Start Here boundary.');
  const result={schemaVersion:value.schemaVersion};
  if(value.audience != null){
    const a=object(value.audience,['kind'],['connectionPublicId','name','version']);
    if(a.version != null && (!Number.isSafeInteger(a.version) || a.version<1)) throw new Error('Invalid audience version.');
    result.audience={kind:text(a.kind),connectionPublicId:optionalText(a.connectionPublicId),name:optionalText(a.name),version:a.version??null};
  }
  const p=object(value.planner,['display_name','locale','time_zone']);
  result.planner={display_name:text(p.display_name),locale:text(p.locale),time_zone:text(p.time_zone)};
  result.plan={status:text(object(value.plan,['status']).status)};
  result.matters=value.matters.map(item=>{
    const m=object(item,['publicId','category','title'],['institutionName','locationHint','desiredOutcome','status']);
    return {publicId:text(m.publicId),category:text(m.category),title:text(m.title),institutionName:optionalText(m.institutionName),
      locationHint:optionalText(m.locationHint),desiredOutcome:optionalText(m.desiredOutcome),status:optionalText(m.status)};
  });
  result.trustedContacts=value.trustedContacts.map(item=>{
    const c=object(item,['displayName'],['relationshipLabel']);
    return {displayName:text(c.displayName),relationshipLabel:optionalText(c.relationshipLabel)};
  });
  result.directionsNotPasswords=true;result.legalAuthorityNotGranted=true;
  return JSON.stringify(result);
}

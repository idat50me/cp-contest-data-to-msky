function fetch_clist_contests_data() {
  const prop = PropertiesService.getScriptProperties().getProperties();
  const username = prop.clist_username;
  const clist_api_key = prop.clist_api_key;
  const during = "28 days";
  const resource_ids = "1,93,109";
  const order_by = "start";

  let req_url = `https://clist.by/api/v4/contest/?format=json&username=${username}&api_key=${clist_api_key}&start_time__during=${during}&resource_id__in=${resource_ids}&order_by=${order_by}&upcoming=true`
  let result_json = UrlFetchApp.fetch(req_url).getContentText();
  let result = JSON.parse(result_json);

  return result.objects;
}

function update_misskey_page_context(contests) {
  const prop = PropertiesService.getScriptProperties().getProperties();
  const now_d = new Date().toISOString();
  let data_json = JSON.stringify({updated: now_d, data: contests});
  const req_url = "https://misskey.kyoupro.com/api/pages/update"
  const payload = {
    pageId: prop.misskey_page_id,
    content: [{
      type: "text",
      text: data_json
    }]
  };
  const options = {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${prop.misskey_api_key}`},
    payload: JSON.stringify(payload)
  };

  UrlFetchApp.fetch(req_url, options);
}

function main() {
  let contests_json = fetch_clist_contests_data();
  update_misskey_page_context(contests_json);
}

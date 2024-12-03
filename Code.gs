function fetch_clist_contests_data() {
  const prop = PropertiesService.getScriptProperties().getProperties();
  const username = prop.clist_username;
  const clist_api_key = prop.clist_api_key;
  const during = "90 days";
  const resource_ids = "1,93";
  const now_date = new Date().toISOString();

  let req_url = `https://clist.by/api/v4/contest/?format=json&username=${username}&api_key=${clist_api_key}&start_time__during=${during}&resource_id__in=${resource_ids}&end__gt=${now_date}`
  let response = UrlFetchApp.fetch(req_url);
  let response_code = response.getResponseCode();
  let response_body = response.getContentText();

  let contests = [];

  if (response_code === 200) {
    console.info("Request success (CLIST)");

    let result = JSON.parse(response_body);

    // data format
    contests = result.objects.map((c) => ({
      name: c.event,
      start: new Date(c.start + "Z"), // UTCであることを明示
      end: new Date(c.end + "Z"),
      duration: c.duration,
      resource: c.resource,
      link: c.href
    }));
  }
  else {
    console.error(`Request failed (CLIST) ${response_code}: ${response_body}`);
    contests = [];
  }
  
  return contests;
}

function fetch_yuki_contests_data() {
  let contests = [];

  // future
  let req_url_future = "https://yukicoder.me/api/v1/contest/future"
  let response_future = UrlFetchApp.fetch(req_url_future);
  let response_code_future = response_future.getResponseCode();
  let response_body_future = response_future.getContentText();

  if (response_code_future === 200) {
    console.info("Request success (yukicoder_future)");

    let result = JSON.parse(response_body_future);

    // data format
    contests = result.map((c) => {
      let s_time = new Date(c.Date);
      let e_time = new Date(c.EndDate);
      let duration = Math.round((e_time.getTime() - s_time.getTime()) / 1000);

      return {
        name: c.Name,
        start: s_time,
        end: e_time,
        duration: duration,
        resource: "yukicoder.me",
        link: `https://yukicoder.me/contests/${c.Id}`
      }
    });
  }
  else {
    console.error(`Request failed (yukicoder_future) ${response_code_future}: ${response_body_future}`);
  }

  // current
  let req_url_current = "https://yukicoder.me/api/v1/contest/current"
  let response_current = UrlFetchApp.fetch(req_url_current);
  let response_code_current = response_current.getResponseCode();
  let response_body_current = response_current.getContentText();

  if (response_code_current === 200) {
    console.info("Request success (yukicoder_current)");

    let result = JSON.parse(response_body_current);

    // data format
    contests = contests.concat(result.map((c) => {
      let s_time = new Date(c.Date);
      let e_time = new Date(c.EndDate);
      let duration = Math.round((e_time.getTime() - s_time.getTime()) / 1000);

      return {
        name: c.Name,
        start: s_time,
        end: e_time,
        duration: duration,
        resource: "yukicoder.me",
        link: `https://yukicoder.me/contests/${c.Id}`
      }
    }));
  }
  else {
    console.error(`Request failed (yukicoder_current) ${response_code_current}: ${response_body_current}`);
  }
  
  return contests;
}

function get_contests_data() {
  let clist_contests = fetch_clist_contests_data();
  let yuki_contests = fetch_yuki_contests_data();

  let all_contests = clist_contests.concat(yuki_contests);
  all_contests.sort((a, b) => a.start - b.start);
  for(let i = 0, len = all_contests.length; i < len; i++) {
    all_contests[i].start = all_contests[i].start.toISOString();
    all_contests[i].end = all_contests[i].end.toISOString();
  }
  return all_contests;
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

  let response = UrlFetchApp.fetch(req_url, options);
  let response_code = response.getResponseCode();
  let response_body = response.getContentText();

  if (response_code === 204) {
    console.info("Request success (misskey)");
  }
  else {
    console.error(`Request failed (misskey) ${response_code}: ${response_body}`);
  }
}

function main() {
  let contests_json = get_contests_data();
  update_misskey_page_context(contests_json);
}

(async () => {
    const url = "https://hub-api-news.app.afp.com/search";
    const headers = {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "es-GT,es-419;q=0.9,es;q=0.8",
        "authorization": "Bearer uI7x2ioyk-XFc_3y9YqnupdTBlU",
        "content-type": "application/json",
        "dnt": "1",
        "origin": "https://news.afp.com",
        "referer": "https://news.afp.com/",
        "sec-ch-ua": `"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"`,
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": `"Windows"`,
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "x-span-id": "454886a0-ceb8-11ef-bf35-1146fcaf7932",
        "x-trace-id": "f31be060-cea9-11ef-8557-f5afd6b7f047"
    };

    const payload = {
        "query": `query getStories (
                  $maxRows: Int,
                  $cursor: String,
                  $criteria: String,
                  $searchLanguage: String!,
                  $dateRange: DateRangeInput,
                  $userResearch: Boolean,
                  $getSelections: Boolean,
                  $sortOrder:String, $includedSub:Boolean, $language:[String!], $theme:[String!], $location:[String!], $country:[String!], $person:[String!], $textType:[String!], $wordCount:[String!], $provider:[String!]
                )
{
  search:stories( maxRows: $maxRows,
                  cursor: $cursor,
                  criteria: $criteria,
                  searchLanguage: $searchLanguage,
                  dateRange: $dateRange,
                  wantedLanguages:$language,
                  userResearch: $userResearch,
                  getSelections: $getSelections,
                   sortOrder:$sortOrder, includedSub:$includedSub, language:$language, theme:$theme, location:$location, country:$country, person:$person, textType:$textType, wordCount:$wordCount, provider:$provider
                )
  {
    docs {
      id
      type
      title
      selections
      country: countryname
      city
      guid
      contentCreated
      introduced
      dateToDisplay
      source
      notIncludedInSubscription
      genre
      isUrgent
      isAlert
      isFlash
      isPressRelease
      wordCount
      slug
      publicationDayWithUserTimezone: dayOfDateTodisplay (timezoneOffset:-360)
      cost
      provider_name
      contributor
      lang
      partner {
        gcp {
          providername
          provider_code
        }
      }
    }
    nextCursor
    hasMore
    numFound
  }
}`,
        "variables": {
            "timezoneOffset": -360,
            "maxRows": 40,
            "searchLanguage": "es",
            "language": ["es"],
            "theme": ["economy", "entertainment", "general", "planet", "science", "society", "sport"],
            "getFacet": false,
            "userResearch": false,
            "getSelections": true
        },
        "operationName": "getStories"
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("Resultado de la petición:", result);
    } catch (error) {
        console.error("Error realizando la petición:", error);
    }
})();

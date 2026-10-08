export default async function handler(req, res) {
  try {
    /*
     * These values are stored in Vercel Environment Variables.
     *
     * NEVER put your access token directly into index.html
     * or commit it to GitHub.
     */

    const accessToken =
      process.env.INSTAGRAM_ACCESS_TOKEN;

    const instagramUserId =
      process.env.INSTAGRAM_USER_ID;


    if (!accessToken || !instagramUserId) {

      return res.status(500).json({
        error:
          "Instagram API is not configured. Add INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID in Vercel."
      });

    }


    /*
     * Instagram Graph API media endpoint.
     *
     * We request the newest media and then select
     * the first three video posts.
     */

    const fields = [
      "id",
      "caption",
      "media_type",
      "media_url",
      "thumbnail_url",
      "permalink",
      "timestamp"
    ].join(",");


    const url =
      "https://graph.facebook.com/v23.0/" +
      encodeURIComponent(instagramUserId) +
      "/media" +
      "?fields=" +
      encodeURIComponent(fields) +
      "&limit=10" +
      "&access_token=" +
      encodeURIComponent(accessToken);


    const response =
      await fetch(url);


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "Instagram API error:",
        data
      );


      return res.status(
        response.status
      ).json({

        error:
          "Instagram API request failed.",

        details:
          data.error?.message ||
          "Unknown Instagram API error."

      });

    }


    /*
     * Keep video content only.
     *
     * VIDEO is the media type used for video posts/Reels
     * returned by the API.
     */

    const videos =
      (data.data || [])
        .filter(
          item =>
            item.media_type === "VIDEO"
        )
        .slice(0, 3)
        .map(item => ({

          id:
            item.id,

          title:
            item.caption
              ? item.caption
                  .split("\n")[0]
                  .slice(0, 90)
              : "Latest beauty transformation ✨",

          video_url:
            item.media_url,

          thumbnail_url:
            item.thumbnail_url || null,

          permalink:
            item.permalink,

          date:
            item.timestamp

        }));


    /*
     * Tell browsers/CDNs that this response can be cached
     * for a short period. This prevents unnecessary API calls
     * every time someone opens the homepage.
     */

    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );


    return res.status(200).json({
      items: videos
    });


  } catch (error) {

    console.error(
      "Instagram function error:",
      error
    );


    return res.status(500).json({

      error:
        "Unable to load Instagram videos."

    });

  }
}

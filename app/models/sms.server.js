/**
 * Generic HTTP SMS-gateway sender. The merchant supplies the endpoint, the
 * HTTP method and a parameter template in the app settings; this fills the
 * placeholders and fires the request. No provider-specific code — it works
 * with any gateway that takes an HTTP call.
 *
 * Placeholders in the template: {apiKey} {senderId} {phone} {message}
 *
 * Examples:
 *   GET  url  https://api.bulksmsbd.net/api/smsapi
 *        tmpl api_key={apiKey}&senderid={senderId}&number={phone}&message={message}
 *
 *   POST url  https://your-gateway/send   (JSON body)
 *        tmpl {"api_key":"{apiKey}","senderid":"{senderId}","number":"{phone}","message":"{message}"}
 *
 * Returns { sent, demo, error }:
 *   demo:true   → no gateway configured; caller should surface the code
 *                 on screen so the flow can be demoed.
 */
export async function sendSms(settings, { phone, message }) {
  const url = (settings.otpSmsApiUrl || "").trim();
  const key = (settings.otpSmsApiKey || "").trim();
  const template = (settings.otpSmsParamsTemplate || "").trim();

  if (!url || !key || !template) return { sent: false, demo: true };

  const encoded = (str) =>
    str
      .replaceAll("{apiKey}", encodeURIComponent(key))
      .replaceAll("{senderId}", encodeURIComponent(settings.otpSmsSenderId || ""))
      .replaceAll("{phone}", encodeURIComponent(phone))
      .replaceAll("{message}", encodeURIComponent(message));

  const raw = (str) =>
    str
      .replaceAll("{apiKey}", key)
      .replaceAll("{senderId}", settings.otpSmsSenderId || "")
      .replaceAll("{phone}", phone)
      .replaceAll("{message}", message);

  try {
    const method = (settings.otpSmsMethod || "POST").toUpperCase();
    let response;

    if (method === "GET") {
      const sep = url.includes("?") ? "&" : "?";
      response = await fetch(url + sep + encoded(template), { method: "GET" });
    } else {
      const jsonBody = raw(template).trim();
      const isJson = jsonBody.startsWith("{") || jsonBody.startsWith("[");
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": isJson
            ? "application/json"
            : "application/x-www-form-urlencoded",
        },
        body: isJson ? jsonBody : encoded(template),
      });
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        sent: false,
        demo: false,
        error: `SMS gateway responded ${response.status}: ${text.slice(0, 200)}`,
      };
    }
    return { sent: true, demo: false };
  } catch (error) {
    return { sent: false, demo: false, error: String(error?.message || error) };
  }
}

export const PdfSummarizeAiApiFn = async (PDFExtracterText=`VISHAL KANOJIYA React JS Developer / Front End Developer +91 8097859158 Koparkhairne, Navi Mumbai kanojiya9768@gmail.com ABOUT ME Frontend Centric Full-Stack Web Developer with 2+ years of professional experience in building scalable, high- performance web applications. Specialized in React.js, Next.js (Pages & App Router), and TypeScript, with hands-on expertise in Next js and Vercel deployments. Proven experience delivering SEO-optimized, highperformance websites for clients in healthcare, e-commerce, real estate, digital marketing, and educational sectors. WORK EXPERIENCE GBIM Technologies – Front-End Developer DEC 2024 – JUNE 2025 Worked on responsive, high-performance web apps using React.js and Next.js. Collaborate with UI/UX teams and ensure scalable, clean code with Tailwind CSS. Focus on speed optimization and cross-browser compatibility. Currently working on the ASBS MBA college website project, focused on delivering a responsive, SEO-optimized platform using React.js, Next.js, and Tailwind CSS. The site highlights ASBS's international MBA program, featuring global exposure in Slovenia, Germany, and Austria. Boppo Technologies – Front-End Developer Sep 2023 – Oct 2024 Built scalable web platforms using Next.js and integrated third- party APIs. Ensured on-time delivery and enhanced user experience through performance tuning. Developed “Boppo Go,” a multi-vendor e-commerce platform with Next.js tailwind css. Built admin dashboards and collaborated on key payment and product flows. The Adroit – React Developer ( Internship Only) Jun 2023 – Sep 2023 Converted UI/UX wireframes into responsive components using React.js. Developed modules for classes, placements, and counseling support. Gained hands-on experience in state management and modern front-end tools. EDUCATION SSC (10TH) Roopshree Vidhyalya 2018 HSC (12TH) Sai nath junior collage 2018 - 2020 BACHELOR OF COMPUTER SCIENCE south indian education society (SIES) 2020 - 2023 CSS SKILL HTML5 Javascript , Es6 Typescript React js (Library) Next js (Framework) Tailwind css SEO in React js Node js , Express js Mongo DB https://github.com/kanojiya9768 Visit My Portfolio 8848 Digital LLP - React js Developer Aug 2025 - Sep 2025 Working on Jewellery E-commerce Website and its Admin Panel. Working on Api Integration on Both Admin Panel as well as on User site. Responsible for front end Development of Projects. Explore More For detailed case studies and additional projects, visit: kanojiya-s-dev.vercel.app`) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPEN_ROUTER_GROK_4_API_KEY}`,
      },
      body: JSON.stringify({
        model: "x-ai/grok-4-fast:free",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this PDF text and create a comprehensive Explanation. Text: ${PDFExtracterText}, Format your response as a natural, flowing narrative that someone would enjoy listening to as an audio summary.`,
              },
            ],
          },
        ],
        stream: true,
      }),
    });

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Get the readable stream from the response body
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let result = "";

    // Read the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("Stream complete");
        break;
      }

      // Decode the chunk and process it
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6); // Remove "data: " prefix
          if (data === "[DONE]") {
            console.log("Received [DONE]");
            break;
          }
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content || "";
            if (content) {
              result += content; // Append content to the result
              console.log("Chunk received:", result); // Log each chunk
            }
          } catch (error) {
            console.error("Error parsing chunk:", error);
          }
        }
      }
    }

    // Final result after stream is complete
    console.log("Complete response:", result);
    return result;

  } catch (error) {
    console.error("Error in streaming request:", error);
    throw error;
  }
};
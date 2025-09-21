export const getQualityColor = (textQuality) => {
  switch (textQuality) {
    case "good":
      return "text-green-600 bg-green-100";
    case "fair":
      return "text-yellow-600 bg-yellow-100";
    case "basic":
      return "text-orange-600 bg-orange-100";
    case "raw":
      return "text-red-600 bg-red-100";
    case "failed":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

// quality config
export const QUALITY_CONFIG = {
  good: {
    label: "Excellent extraction with proper formatting",
    color: "bg-green-100 text-green-700",
  },
  fair: {
    label: "Good extraction with minor formatting issues",
    color: "bg-yellow-100 text-yellow-700",
  },
  basic: {
    label: "Readable text recovered with basic cleanup",
    color: "bg-orange-100 text-orange-700",
  },
  raw: {
    label: "Text recovered but may need manual review",
    color: "bg-red-100 text-red-700",
  },
};

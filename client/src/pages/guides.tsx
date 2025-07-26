import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIChatInterface } from "@/components/ai-chat-interface";
import { 
  FileText,
  Ship,
  DollarSign,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Package,
  Truck,
  Building,
  Users
} from "lucide-react";

const INCOTERMS = [
  {
    code: "FOB",
    name: "Free on Board",
    explanation: "You pay for shipping from the port. Seller covers costs to get goods to the origin port.",
    sellerPays: ["Product cost", "Export packaging", "Loading at origin", "Export customs"],
    buyerPays: ["Sea freight", "Import customs", "Delivery to door", "Insurance (optional)"],
    riskTransfer: "When goods cross ship's rail at origin port",
    bestFor: "When you want control over shipping and costs",
    example: "FOB Shanghai means the Chinese supplier delivers to Shanghai port. You arrange and pay for shipping from there.",
    difficulty: "Intermediate"
  },
  {
    code: "CIF", 
    name: "Cost, Insurance, and Freight",
    explanation: "Seller pays for shipping and insurance to destination port. You handle customs and final delivery.",
    sellerPays: ["Product cost", "Sea freight", "Marine insurance", "Export customs"],
    buyerPays: ["Import customs", "Port fees", "Delivery from port", "Unloading"],
    riskTransfer: "When goods cross ship's rail at origin port (despite seller paying freight)",
    bestFor: "Beginners who want seller to handle main shipping",
    example: "CIF Durban means supplier pays to get goods to Durban port. You collect from there.",
    difficulty: "Beginner"
  },
  {
    code: "EXW",
    name: "Ex Works",
    explanation: "You collect goods from seller's premises and handle everything from there.",
    sellerPays: ["Product cost only"],
    buyerPays: ["Collection from seller", "All transport", "All customs", "All insurance"],
    riskTransfer: "At seller's premises when goods are made available",
    bestFor: "Experienced importers wanting full control",
    example: "EXW Guangzhou factory means you arrange pickup from the factory and handle all shipping.",
    difficulty: "Advanced"
  },
  {
    code: "DDP",
    name: "Delivered Duty Paid", 
    explanation: "Seller handles everything including customs duties. Goods delivered ready to use.",
    sellerPays: ["Product cost", "All transport", "All customs duties", "All insurance"],
    buyerPays: ["Nothing - just receive the goods"],
    riskTransfer: "When goods are delivered to your specified location",
    bestFor: "First-time importers who want hassle-free delivery",
    example: "DDP Johannesburg means supplier delivers to your Johannesburg address with all duties paid.",
    difficulty: "Beginner"
  }
];

const CUSTOMS_PROCESS = [
  {
    step: 1,
    title: "Prepare Documentation",
    description: "Gather all required documents before goods arrive",
    documents: [
      "Commercial Invoice (shows product value and details)",
      "Bill of Lading (shipping receipt from carrier)",
      "Packing List (detailed contents description)",
      "Import Permit (if required for restricted goods)",
      "Certificate of Origin (for trade agreement benefits)"
    ],
    tips: "Ensure all documents have matching information. Discrepancies cause delays."
  },
  {
    step: 2,
    title: "Calculate Duties & VAT",
    description: "SARS calculates what you owe based on FOB value",
    process: [
      "Customs value = FOB value (excludes shipping costs)",
      "Import duty = FOB value × duty rate for your product",
      "VAT = (FOB value + duty) × 15%",
      "Total = FOB value + duty + VAT + processing fees"
    ],
    tips: "Use our calculator to estimate costs before shipping. Actual rates depend on SARS classification."
  },
  {
    step: 3,
    title: "Customs Clearance",
    description: "SARS processes your import and releases goods",
    process: [
      "Submit documents to customs agent or SARS",
      "SARS reviews and may inspect goods",
      "Pay calculated duties and VAT",
      "Receive customs clearance certificate",
      "Arrange collection or delivery"
    ],
    tips: "Use a registered customs agent if you're new to importing. They handle SARS procedures."
  }
];

const REQUIRED_DOCUMENTS = [
  {
    name: "Commercial Invoice",
    required: true,
    description: "Shows what you bought, quantity, value, and seller details",
    tips: "Must match exactly with other documents. Include HS code if known."
  },
  {
    name: "Bill of Lading",
    required: true,
    description: "Receipt from shipping company showing cargo details and routing",
    tips: "Original document needed for cargo release. Get from your freight forwarder."
  },
  {
    name: "Packing List",
    required: true,
    description: "Detailed breakdown of package contents, weights, and dimensions",
    tips: "Should list every item separately with clear descriptions."
  },
  {
    name: "Import Permit",
    required: false,
    description: "Required for restricted goods like food, electronics, or chemicals",
    tips: "Check with relevant authorities (NRCS, ICASA, etc.) before shipping."
  },
  {
    name: "Certificate of Origin",
    required: false,
    description: "Proves where goods were manufactured for trade agreement benefits",
    tips: "Can reduce or eliminate customs duties for qualifying countries."
  }
];

export function Guides() {
  const [selectedIncoterm, setSelectedIncoterm] = useState<string>("FOB");
  const [activeTab, setActiveTab] = useState("incoterms");

  const selectedIncotermData = INCOTERMS.find(term => term.code === selectedIncoterm);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI Chat Interface */}
      <AIChatInterface context="guides" />

      {/* Header */}
      <div className="pt-32 pb-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Customs & Incoterms Guide
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Learn international shipping terms and South African customs procedures in plain language
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="incoterms" className="flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Incoterms
            </TabsTrigger>
            <TabsTrigger value="customs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Customs Process
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Incoterms Tab */}
          <TabsContent value="incoterms" className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Incoterm Selection */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Choose an Incoterm</h3>
                <div className="space-y-3">
                  {INCOTERMS.map((term) => (
                    <Button
                      key={term.code}
                      variant={selectedIncoterm === term.code ? "default" : "outline"}
                      className="w-full justify-start p-4 h-auto"
                      onClick={() => setSelectedIncoterm(term.code)}
                    >
                      <div className="text-left">
                        <div className="font-semibold">{term.code}</div>
                        <div className="text-sm opacity-80">{term.name}</div>
                        <Badge className={`mt-1 ${getDifficultyColor(term.difficulty)} text-xs`}>
                          {term.difficulty}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Incoterm Details */}
              <div className="lg:col-span-2">
                {selectedIncotermData && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl">
                            {selectedIncotermData.code} - {selectedIncotermData.name}
                          </CardTitle>
                          <CardDescription className="text-lg mt-2">
                            {selectedIncotermData.explanation}
                          </CardDescription>
                        </div>
                        <Badge className={getDifficultyColor(selectedIncotermData.difficulty)}>
                          {selectedIncotermData.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Example */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-1">Real Example</h4>
                            <p className="text-blue-800">{selectedIncotermData.example}</p>
                          </div>
                        </div>
                      </div>

                      {/* Cost Breakdown */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-600" />
                            Seller Pays For
                          </h4>
                          <ul className="space-y-2">
                            {selectedIncotermData.sellerPays.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Building className="h-4 w-4 text-blue-600" />
                            Buyer Pays For
                          </h4>
                          <ul className="space-y-2">
                            {selectedIncotermData.buyerPays.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Risk Transfer */}
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-yellow-900 mb-1">Risk Transfer Point</h4>
                            <p className="text-yellow-800">{selectedIncotermData.riskTransfer}</p>
                          </div>
                        </div>
                      </div>

                      {/* Best For */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-green-900 mb-1">Best For</h4>
                            <p className="text-green-800">{selectedIncotermData.bestFor}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Customs Process Tab */}
          <TabsContent value="customs" className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold mb-4">South African Customs Process</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Understanding SARS procedures helps avoid delays and unexpected costs
              </p>
            </div>

            <div className="space-y-8">
              {CUSTOMS_PROCESS.map((step) => (
                <Card key={step.step}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {step.step}
                      </div>
                      <div>
                        <CardTitle>{step.title}</CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">
                          {step.documents ? "Required Documents:" : "Process Steps:"}
                        </h4>
                        <ul className="space-y-2">
                          {(step.documents || step.process)?.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Pro Tip
                        </h4>
                        <p className="text-blue-800 text-sm">{step.tips}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold mb-4">Import Documentation Checklist</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Prepare these documents before your goods arrive to avoid customs delays
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {REQUIRED_DOCUMENTS.map((doc, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {doc.name}
                      </CardTitle>
                      <Badge variant={doc.required ? "default" : "secondary"}>
                        {doc.required ? "Required" : "Optional"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{doc.description}</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Tip
                      </h4>
                      <p className="text-gray-700 text-sm">{doc.tips}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
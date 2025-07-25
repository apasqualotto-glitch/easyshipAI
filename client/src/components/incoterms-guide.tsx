import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { useQuery } from "@tanstack/react-query";
import { type Incoterm } from "@shared/schema";

interface IncotermsGuideProps {
  selectedIncoterm?: string;
}

export default function IncotermsGuide({ selectedIncoterm }: IncotermsGuideProps) {
  const { data: incoterms = [] } = useQuery({
    queryKey: ["/api/incoterms"],
  });

  const selectedIncotermData = incoterms.find((term: Incoterm) => term.code === selectedIncoterm);

  return (
    <Card className="shadow-material">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Incoterms Guide</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <span className="material-icons text-sm mr-1">info</span>
                View All
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Incoterms 2020 Guide</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {incoterms.map((incoterm: Incoterm) => (
                  <div key={incoterm.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono">{incoterm.code}</Badge>
                      <h4 className="font-medium">{incoterm.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{incoterm.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <h5 className="font-medium text-green-700 mb-1">Seller Responsibilities</h5>
                        <ul className="space-y-1">
                          {incoterm.sellerResponsibilities.map((resp, index) => (
                            <li key={index} className="flex items-start">
                              <span className="material-icons text-green-500 text-sm mr-1 mt-0.5">check</span>
                              <span className="text-gray-600">{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-blue-700 mb-1">Buyer Responsibilities</h5>
                        <ul className="space-y-1">
                          {incoterm.buyerResponsibilities.map((resp, index) => (
                            <li key={index} className="flex items-start">
                              <span className="material-icons text-blue-500 text-sm mr-1 mt-0.5">check</span>
                              <span className="text-gray-600">{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 bg-gray-50 rounded">
                      <div className="flex items-center text-xs">
                        <span className="material-icons text-orange-500 text-sm mr-1">swap_horiz</span>
                        <span className="font-medium text-gray-700">Risk Transfer:</span>
                        <span className="text-gray-600 ml-1">{incoterm.riskTransferPoint}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {selectedIncotermData ? (
          <div className="space-y-4">
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary-500 text-white font-mono">{selectedIncotermData.code}</Badge>
                <h4 className="font-medium text-primary-800">{selectedIncotermData.name}</h4>
              </div>
              <p className="text-sm text-primary-700">{selectedIncotermData.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="bg-green-50 rounded-lg p-3">
                <h5 className="font-medium text-green-800 mb-2 flex items-center">
                  <span className="material-icons text-green-600 text-sm mr-1">business</span>
                  Your Supplier Handles
                </h5>
                <ul className="space-y-1">
                  {selectedIncotermData.sellerResponsibilities.slice(0, 3).map((resp, index) => (
                    <li key={index} className="text-xs text-green-700 flex items-start">
                      <span className="material-icons text-green-500 text-xs mr-1 mt-0.5">check_circle</span>
                      {resp}
                    </li>
                  ))}
                  {selectedIncotermData.sellerResponsibilities.length > 3 && (
                    <li className="text-xs text-green-600">+ {selectedIncotermData.sellerResponsibilities.length - 3} more...</li>
                  )}
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                  <span className="material-icons text-blue-600 text-sm mr-1">person</span>
                  You Handle
                </h5>
                <ul className="space-y-1">
                  {selectedIncotermData.buyerResponsibilities.slice(0, 3).map((resp, index) => (
                    <li key={index} className="text-xs text-blue-700 flex items-start">
                      <span className="material-icons text-blue-500 text-xs mr-1 mt-0.5">check_circle</span>
                      {resp}
                    </li>
                  ))}
                  {selectedIncotermData.buyerResponsibilities.length > 3 && (
                    <li className="text-xs text-blue-600">+ {selectedIncotermData.buyerResponsibilities.length - 3} more...</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center text-sm">
                <span className="material-icons text-orange-600 text-sm mr-2">swap_horiz</span>
                <span className="font-medium text-orange-800">Risk Transfers:</span>
                <span className="text-orange-700 ml-1">{selectedIncotermData.riskTransferPoint}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="material-icons text-gray-400 text-4xl mb-2">assignment</span>
            <p className="text-gray-500">Select an Incoterm to see detailed explanation</p>
            <p className="text-xs text-gray-400 mt-1">Incoterms define responsibilities between buyer and seller</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
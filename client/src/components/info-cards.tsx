import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InfoCards() {
  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <span className="material-icons text-primary-500 mr-3">schedule</span>
            <h3 className="text-lg font-medium text-gray-900">Transit Times</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Shanghai to Durban:</span>
              <span className="font-medium">18-22 days</span>
            </div>
            <div className="flex justify-between">
              <span>Hamburg to Cape Town:</span>
              <span className="font-medium">14-18 days</span>
            </div>
            <div className="flex justify-between">
              <span>Port to Johannesburg:</span>
              <span className="font-medium">2-3 days</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <span className="material-icons text-secondary-500 mr-3">assignment</span>
            <h3 className="text-lg font-medium text-gray-900">Required Documents</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="material-icons text-secondary-400 text-base mr-2">check</span>
              Commercial Invoice
            </li>
            <li className="flex items-center">
              <span className="material-icons text-secondary-400 text-base mr-2">check</span>
              Packing List
            </li>
            <li className="flex items-start">
              <span className="material-icons text-secondary-400 text-base mr-2">check</span>
              <span>Bill of Lading — carrier receipt for your cargo</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons text-secondary-400 text-base mr-2">check</span>
              <span>Certificate of Origin — proves where goods were made</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <span className="material-icons text-accent-500 mr-3">support_agent</span>
            <h3 className="text-lg font-medium text-gray-900">Need Help?</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Use the AI chat for instant help. Expert call booking is not available yet.</p>
          <div className="space-y-2">
            <Button className="w-full bg-accent-500 hover:bg-accent-600 text-sm min-h-11" disabled title="Coming soon">
              Contact Expert (Coming soon)
            </Button>
            <Button variant="outline" className="w-full text-sm min-h-11" disabled title="Coming soon">
              Schedule Call (Coming soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import React from 'react';
import { Calendar, Zap, ArrowRight, Users } from 'lucide-react';

interface WelcomePageProps {
  onNext: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onNext }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-600 p-4 rounded-2xl">
              <Users className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to ParentPal
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your calm, organized co-parent for busy family life
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-indigo-100 p-3 rounded-xl w-fit mb-6">
              <Zap className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Smart Event Parsing
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Paste school emails and we'll extract all the important details. Never miss another field trip permission slip or parent-teacher conference again.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-indigo-100 p-3 rounded-xl w-fit mb-6">
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Family Dashboard
            </h3>
            <p className="text-gray-600 leading-relaxed">
              See everyone's schedule at a glance with smart reminders. Avoid double-booking and keep your family perfectly coordinated.
            </p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onNext}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center mx-auto"
          >
            Get Started - It's Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
          <p className="text-gray-500 mt-4 text-sm">
            Takes just 2 minutes to set up. No credit card required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
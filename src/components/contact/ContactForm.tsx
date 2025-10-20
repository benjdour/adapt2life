"use client";

import { FormEvent } from "react";

type ContactFormCopy = {
  heading: string;
  fields: {
    name: string;
    email: string;
    subject: string;
    message: string;
  };
  submitLabel: string;
  successMessage: string;
};

type ContactFormProps = {
  copy: ContactFormCopy;
};

export function ContactForm({ copy }: ContactFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alert(copy.successMessage);
    event.currentTarget.reset();
  };

  return (
    <section className="bg-gray-900 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-center text-4xl font-bold text-green-400">
          {copy.heading}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-lg font-medium text-gray-200"
            >
              {copy.fields.name}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-lg font-medium text-gray-200"
            >
              {copy.fields.email}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="subject"
              className="mb-2 block text-lg font-medium text-gray-200"
            >
              {copy.fields.subject}
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              required
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="message"
              className="mb-2 block text-lg font-medium text-gray-200"
            >
              {copy.fields.message}
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-orange-500 px-8 py-4 font-semibold text-white transition duration-300 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {copy.submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}

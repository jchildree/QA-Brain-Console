# QA Brain: Overview

**Prepared for:** QA Director
**Prepared by:** Joseph Childree
**Date:** July 30, 2026
**Industrial Laboratories Company**

---

## Purpose

Every quality organization keeps two sets of records: the official ones, and the ones that exist in half-finished Word docs, email threads, and someone's memory. QA Brain was built to close that gap -- to give the drafting and thinking work a real home before it becomes an official record.

QA Brain is a tool for drafting and managing our quality records -- SOPs, CAPAs, Incidents, Change Requests, Audits, and Training records -- in one connected workspace, before they're finalized and pushed into Intellect.

Intellect remains our official system of record. That does not change. QA Brain is the layer *before* a document becomes official -- it replaces the folder of half-finished drafts, not the QMS.

## What It Does

**Structured forms per record type.** Each record type has its own form, with consistent fields -- status, owner, department, review date -- every time. No re-copying last quarter's template and hoping nothing was missed.

**One lifecycle, no exceptions.** Every record follows the same path: Draft -> In Review -> Approved -> Obsolete. No invented statuses, no records sitting in an undefined state that only one person understands.

**Cross-linked records.** An Incident links to the CAPA it generated; that CAPA links back to the SOP it affected. Audit findings and Training records feed into the same picture. This relationship is difficult to maintain in a spreadsheet -- it's built into the structure here.

**Live dashboards.** A real-time view of open records, overdue reviews, and incident trends, without opening individual folders.

**A shared evidence library.** One attachment store, working across every record type, so supporting files stop living in email.

**A named-account audit trail.** Every save is tied to a real user account, so we always know who created a record and who last touched it.

## Role of AI

AI -- Claude, from Anthropic -- is used in exactly one place: intake.

When someone is drafting a new record, they can paste in raw notes -- a description of what happened, details from a conversation, whatever they have -- and the system reads it and populates the structured fields (department, owner, title, summary, and so on) instead of a person typing it all in by hand.

That is the full extent of its role. The AI does not approve records, does not make quality decisions, and does not touch a record once it moves past Draft. Every field it populates is editable, and a person still reviews and moves the record through the same Draft -> In Review -> Approved workflow as always. It is a drafting assistant, not a decision-maker.

## Business Value

A meaningful share of our quality documentation time currently goes into formatting, locating the right template, and tracking which record relates to which -- overhead that produces no quality outcome on its own. QA Brain reduces that overhead so time goes toward the work that requires a trained person: root cause analysis, corrective action design, audit preparation.

The secondary benefit is visibility: a clear, real-time picture of what's open, what's overdue, and how records connect to one another.

## Hosting & Security

QA Brain runs on our own infrastructure, not a public cloud service. Access is by named login only, and traffic is encrypted in transit.

The only outbound call the system makes is to the Anthropic API, and only when a user actively uses the intake-assist feature -- and only for the text that user chooses to submit at that moment. No other data leaves the system.

## Summary

Six record types, one lifecycle, one system of record downstream of all of it. The drafting work was always happening somewhere -- QA Brain gives it a structure, a login, and a timestamp.

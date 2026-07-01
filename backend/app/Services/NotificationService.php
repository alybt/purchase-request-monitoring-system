<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Create a notification and store it in the database.
     */
    public static function createNotification($userId, $purchaseRequestId, $prNumber, $department, $title, $message, $type)
    {
        // Prevent duplicate notification if already exists (same PR, same status/type for same user)
        $exists = Notification::where('user_id', $userId)
            ->where('purchase_request_id', $purchaseRequestId)
            ->where('type', $type)
            ->exists();

        if ($exists) {
            return null;
        }

        return Notification::create([
            'user_id' => $userId,
            'purchase_request_id' => $purchaseRequestId,
            'pr_number' => $prNumber,
            'department' => $department,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'is_read' => false,
        ]);
    }

    /**
     * Notify all admins about a new PR submission.
     */
    public static function notifyAdminsNewPR($pr)
    {
        $admins = User::where('role', 'admin')->get();
        $departmentName = $pr->department ? $pr->department->name : ($pr->requester && $pr->requester->department ? $pr->requester->department->name : 'Unknown Department');

        $title = "New Purchase Request Submitted";
        $message = "A new Purchase Request {$pr->pr_number} has been submitted by {$departmentName} and is waiting for your approval.";

        foreach ($admins as $admin) {
            self::createNotification(
                $admin->id,
                $pr->id,
                $pr->pr_number,
                $departmentName,
                $title,
                $message,
                'Pending'
            );
        }
    }

    /**
     * Notify department head of PR status change.
     */
    public static function notifyDeptHeadStatusChange($pr, $status, $remarks = null)
    {
        // Find the dept head (requester)
        $userId = $pr->user_id; // the user who requested it

        if (!$userId) return;

        $departmentName = $pr->department ? $pr->department->name : '';
        $title = "";
        $message = "";

        switch ($status) {
            case 'Approved':
                $title = "Purchase Request Approved";
                $message = "Your Purchase Request {$pr->pr_number} has been approved.";
                break;
            case 'Rejected':
                $title = "Purchase Request Rejected";
                $message = "Your Purchase Request {$pr->pr_number} has been rejected.";
                if ($remarks) {
                    $message .= "\nReason: {$remarks}";
                }
                break;
            case 'Ordered':
                $title = "Purchase Order Created";
                $message = "Your approved Purchase Request {$pr->pr_number} has been processed and is now being ordered.";
                break;
            case 'Received':
                $title = "Items Received";
                $message = "The requested items for Purchase Request {$pr->pr_number} have been received and are ready for release.";
                break;
            case 'Released':
                $title = "Items Ready for Confirmation";
                $message = "The requested items for Purchase Request {$pr->pr_number} have been released. Please confirm receipt to complete the request.";
                break;
            case 'Completed':
                $title = "Purchase Request Completed";
                $message = "Purchase Request {$pr->pr_number} has been completed. Thank you for confirming receipt.";
                break;
            default:
                return; // Do nothing for other statuses
        }

        self::createNotification(
            $userId,
            $pr->id,
            $pr->pr_number,
            $departmentName,
            $title,
            $message,
            $status
        );
    }
}

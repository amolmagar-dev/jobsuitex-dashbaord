"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  MoreVerticalIcon,
  ClockIcon,
  PhoneIcon,
  ThumbsUpIcon,
  AlertCircleIcon,
  XCircleIcon,
  FilterIcon,
  CheckIcon,
  ExternalLinkIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import jobApplicationService from "@/services/jobApplicationService"

// Define the application type based on your backend data
export interface JobApplication {
  id: string;
  title: string;
  company: string;
  location: string;
  experience: string;
  salary: string;
  rating: string;
  reviews: string;
  postedOn: string;
  description: string;
  skills: string[];
  applyLink: string;
  portal: string;
  status: string;
  appliedOn: string;
  applicationId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationState {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Applied":
      return <ClockIcon className="text-blue-500 dark:text-blue-400" />
    case "Screening":
      return <AlertCircleIcon className="text-yellow-500 dark:text-yellow-400" />
    case "Interview":
      return <PhoneIcon className="text-purple-500 dark:text-purple-400" />
    case "Offer":
      return <ThumbsUpIcon className="text-green-500 dark:text-green-400" />
    case "Rejected":
      return <XCircleIcon className="text-red-500 dark:text-red-400" />
    default:
      return <ClockIcon className="text-blue-500 dark:text-blue-400" />
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

export function JobApplicationsTable() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected application for details modal
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  
  // API pagination state
  const [apiPagination, setApiPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0
  });
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [portalFilter, setPortalFilter] = useState<string>("");
  
  // Sort state
  const [sorting, setSorting] = useState<SortingState>([
    { id: "appliedOn", desc: true }
  ]);
  
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Define columns
  const columns: ColumnDef<JobApplication>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Job Title",
      cell: ({ row }) => {
        return <div className="font-medium max-w-[200px] truncate" title={row.original.title}>{row.original.title}</div>
      },
      enableHiding: false,
    },
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }) => <div>{row.original.company}</div>,
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => <div>{row.original.location}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3">
          {getStatusIcon(row.original.status)}
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "appliedOn",
      header: "Applied Date",
      cell: ({ row }) => <div>{formatDate(row.original.appliedOn)}</div>,
    },
    {
      accessorKey: "portal",
      header: "Portal",
      cell: ({ row }) => <div>{row.original.portal}</div>,
    },
    {
      accessorKey: "salary",
      header: "Salary Range",
      cell: ({ row }) => <div>{row.original.salary}</div>,
    },
    {
      accessorKey: "experience",
      header: "Experience",
      cell: ({ row }) => <div>{row.original.experience}</div>,
    },
    {
      accessorKey: "applyLink",
      header: "Job Link",
      cell: ({ row }) => (
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-0 h-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950"
          onClick={() => {
            if (row.original.applyLink) {
              window.open(row.original.applyLink, '_blank', 'noopener,noreferrer');
            }
          }}
          disabled={!row.original.applyLink}
        >
          <span className="mr-1">View Job</span>
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </Button>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
              <MoreVerticalIcon />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => {
              setSelectedApplication(row.original);
              setDetailsDialogOpen(true);
            }}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-muted-foreground opacity-50">
              Update Status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-muted-foreground opacity-50">
              Add Note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Function to fetch data from API
  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare query params
      const params = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        status: statusFilter || undefined,
        company: companyFilter || undefined,
        portal: portalFilter || undefined,
        sortBy: sorting.length > 0 ? sorting[0].id : 'appliedOn',
        sortOrder: sorting.length > 0 && sorting[0].desc ? 'desc' : 'asc'
      };
      
      const response = await jobApplicationService.jobApplications.getAll(params);
      
      if (response.data && response.data.success) {
        setApplications(response.data.applications);
        setApiPagination(response.data.pagination);
      } else {
        setError("Failed to fetch applications");
      }
    } catch (err) {
      setError("Error fetching applications. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchApplications();
  }, [pagination.pageIndex, pagination.pageSize, statusFilter, companyFilter, portalFilter, sorting]);

  // Table instance
  const table = useReactTable({
    data: applications,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    manualPagination: true,
    pageCount: apiPagination.totalPages,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Calculate status counts
  const statusCounts = React.useMemo(() => {
    const counts = {
      total: applications.length,
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0
    };
    
    applications.forEach(app => {
      if (app.status === "Applied") counts.applied++;
      if (app.status === "Screening") counts.screening++;
      if (app.status === "Interview") counts.interview++;
      if (app.status === "Offer") counts.offer++;
    });
    
    return counts;
  }, [applications]);

  // Reset filters
  const resetFilters = () => {
    setStatusFilter("");
    setCompanyFilter("");
    setPortalFilter("");
    setPagination({
      pageIndex: 0,
      pageSize: 10,
    });
  };

  return (
    <>
        <Tabs 
      defaultValue="all" 
      className="flex w-full flex-col justify-start gap-6"
      onValueChange={(value) => {
        if (value === "all") {
          setStatusFilter("");
        } else if (value === "applied") {
          setStatusFilter("Applied");
        } else if (value === "interview") {
          setStatusFilter("Interview");
        } else if (value === "offer") {
          setStatusFilter("Offer");
        }
      }}
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList className="flex">
          <TabsTrigger value="all">All Applications</TabsTrigger>
          <TabsTrigger value="applied" className="gap-1">
            Applied{" "}
            <Badge
              variant="secondary"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
            >
              {statusCounts.applied}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="interview" className="gap-1">
            Interviews{" "}
            <Badge
              variant="secondary"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
            >
              {statusCounts.interview}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="offer">Offers</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FilterIcon className="mr-2 h-4 w-4" />
                <span className="hidden md:inline">Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <Label htmlFor="company-filter" className="text-xs font-medium">Company</Label>
                <Input 
                  id="company-filter" 
                  placeholder="Filter by company"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="mt-1 h-8"
                />
              </div>
              <div className="p-2">
                <Label htmlFor="portal-filter" className="text-xs font-medium">Portal</Label>
                <Select 
                  value={portalFilter || "all"} 
                  onValueChange={(value) => setPortalFilter(value === "all" ? "" : value)}
                >
                  <SelectTrigger id="portal-filter" className="mt-1 h-8">
                    <SelectValue placeholder="Select Portal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Portals</SelectItem>
                    <SelectItem value="Naukri">Naukri</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Indeed">Indeed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={resetFilters}
                >
                  <CheckIcon className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ColumnsIcon className="mr-2 h-4 w-4" />
                <span className="hidden md:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <TabsContent value="all" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mb-2 text-muted-foreground">Loading applications...</div>
                <div className="mx-auto h-4 w-32 animate-pulse rounded-full bg-muted"></div>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center text-destructive">
                <div>{error}</div>
                <Button variant="outline" size="sm" className="mt-4" onClick={fetchApplications}>
                  Retry
                </Button>
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mb-2 text-muted-foreground">No applications found</div>
                <div className="text-sm text-muted-foreground">Try adjusting your filters</div>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground md:flex">
            {table.getFilteredSelectedRowModel().rows.length} of {apiPagination.totalItems} application(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 md:w-fit">
            <div className="hidden items-center gap-2 md:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="w-20" id="rows-per-page">
                  <SelectValue placeholder={pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {pagination.pageIndex + 1} of {apiPagination.totalPages || 1}
            </div>
            <div className="ml-auto flex items-center gap-2 md:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 md:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 md:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="applied" className="flex flex-col px-4 lg:px-6">
        {/* Using the same table but with different filter */}
        <div className="relative flex flex-col gap-4 overflow-auto">
          {/* Table content would be identical to the "all" tab, but filtered */}
          {/* For simplicity, I'm not duplicating the entire table here */}
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
            <span className="text-muted-foreground">Applied jobs will appear here</span>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="interview" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
          <span className="text-muted-foreground">Interview jobs will appear here</span>
        </div>
      </TabsContent>
      <TabsContent value="offer" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
          <span className="text-muted-foreground">Offers will appear here</span>
        </div>
      </TabsContent>
    </Tabs>
    
    <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{selectedApplication?.title || "Job Details"}</DialogTitle>
          <DialogDescription>
            {selectedApplication?.company} • {selectedApplication?.location}
          </DialogDescription>
        </DialogHeader>
        
        {selectedApplication && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Status</p>
                <Badge variant="outline" className="mt-1 flex w-fit gap-1 px-1.5 text-muted-foreground [&_svg]:size-3">
                  {getStatusIcon(selectedApplication.status)}
                  {selectedApplication.status}
                </Badge>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Applied On</p>
                <p className="mt-1">{formatDate(selectedApplication.appliedOn)}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Posted On</p>
                <p className="mt-1">{selectedApplication.postedOn}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Experience Required</p>
                <p className="mt-1">{selectedApplication.experience}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Salary Range</p>
                <p className="mt-1">{selectedApplication.salary}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Portal</p>
                <p className="mt-1">{selectedApplication.portal}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Application ID</p>
                <p className="mt-1">{selectedApplication.applicationId}</p>
              </div>
            </div>
            
            <div>
              <p className="font-medium text-muted-foreground">Description</p>
              <p className="mt-1 text-sm">{selectedApplication.description}</p>
            </div>
            
            {selectedApplication.skills && selectedApplication.skills.length > 0 && (
              <div>
                <p className="font-medium text-muted-foreground">Skills Required</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedApplication.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {selectedApplication.notes && (
              <div>
                <p className="font-medium text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm">{selectedApplication.notes}</p>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter className="flex sm:justify-between">
          <Button 
            variant="secondary" 
            onClick={() => setDetailsDialogOpen(false)}
          >
            Close
          </Button>
          <Button 
            variant="default"
            onClick={() => {
              if (selectedApplication?.applyLink) {
                window.open(selectedApplication.applyLink, '_blank', 'noopener,noreferrer');
              }
            }}
            disabled={!selectedApplication?.applyLink}
          >
            <span className="mr-2">View Original Listing</span>
            <ExternalLinkIcon className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>

  )
}
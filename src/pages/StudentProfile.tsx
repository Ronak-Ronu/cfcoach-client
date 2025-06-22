import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Student } from '@/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axiosPublic from 'axios';
import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import ThemeToggle from '@/components/utils/ThemeToggler';
import { 
  analyzePerformance, 
  generateWeakAreaPlan,
  recommendDailyProblems 
} from '@/lib/ai-service';

import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText, Loader2 } from 'lucide-react';
import { exportStudentStatsToPDF } from '@/components/utils/exportUtils';
import { useToast } from '@/components/toast-provider';
import { TypingEffect } from '@/components/TypingEffect';
import { Loader } from '@/components/ui/Loader';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface CodeforcesBlogEntry {
  id: number;
  title: string;
  creationTimeSeconds: number;
  rating: number;
  commentCount: number;
}

interface CodeforcesRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

interface Submission {
  submissionId: number;
  contestId: number;
  problemIndex: string;
  problemName: string;
  problemRating: number;
  creationTimeSeconds: number;
  verdict: string;
  participantType?: string; 
}

interface HeatmapData {
  [date: string]: number;
}

interface CodeforcesUserInfo {
  handle: string;
  titlePhoto: string; 
}


// Heatmap Component
const Heatmap = ({
  submissions,
  minYear,
  maxYear,
}: {
  submissions: Submission[];
  minYear: number;
  maxYear: number;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [filter, setFilter] = useState<'A' | 'C' | 'P' | 'V'>('A');
  const [selectedYear, setSelectedYear] = useState<number>(maxYear);
  const width = 900;
  const height = 105;
  const cellSize = 12;
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


  
  const processSubmissions = (data: Submission[], selectedFilter: string, year: number): HeatmapData => {
    const count: HeatmapData = {};
    data
      .filter((submission) => {
        const date = new Date(submission.creationTimeSeconds * 1000);
        if (date.getUTCFullYear() !== year) return false;
        if (submission.verdict !== 'OK') return false;
        if (selectedFilter === 'A') return true;

        const filterMap: { [key: string]: string } = {
          C: 'CONTEST',
          P: 'PRACTICE',
          V: 'VIRTUAL',
        };
        const participantType = submission.participantType || 'PRACTICE'; // Fallback
        return participantType === filterMap[selectedFilter];
      })
      .forEach((submission) => {
        const date = new Date(submission.creationTimeSeconds * 1000);
        const month = date.getUTCMonth() + 1;
        const day = date.getUTCDate();
        const dateStr = `${year}${month < 10 ? '0' : ''}${month}${day < 10 ? '0' : ''}${day}`;
        count[dateStr] = (count[dateStr] || 0) + 1;
      });
    return count;
  };

  const getStats = (data: HeatmapData) => {
    const stats: { maxsub: number; sum: number; avg: string; numdays: number } = {
      maxsub: 0,
      sum: 0,
      avg: '0',
      numdays: 0,
    };
    const values = Object.values(data);
    stats.maxsub = values.length ? Math.max(...values) : 0;
    stats.sum = values.reduce((sum, val) => sum + val, 0);
    stats.numdays = Object.keys(data).length;
    stats.avg = stats.numdays > 0 ? (stats.sum / stats.numdays).toFixed(2) : '0';
    return stats;
  };

  const monthPath = (t0: Date) => {
    const t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0);
    const d0 = +d3.timeFormat('%w')(t0);
    const w0 = +d3.timeFormat('%U')(t0);
    const d1 = +d3.timeFormat('%w')(t1);
    const w1 = +d3.timeFormat('%U')(t1);
    return `M${(w0 + 1) * cellSize},${d0 * cellSize}H${w0 * cellSize}V${7 * cellSize}H${w1 * cellSize}V${(d1 + 1) * cellSize}H${(w1 + 1) * cellSize}V0H${(w0 + 1) * cellSize}Z`;
  };

  const plotHeatmap = (data: HeatmapData) => {
    const stats = getStats(data);
    const color = d3
      .scaleQuantize<string>()
      .domain([0, stats.maxsub > 0 ? stats.maxsub : 1])
      .range(['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']);

    d3.select(svgRef.current)
      .selectAll('.day')
      .transition()
      .duration(750)
      .attr('fill', (d) => {
        const dateStr = d as string;
        const value = dateStr in data ? data[dateStr] : 0;
        return value === 0 ? '#ebedf0' : color(value);
      })
      .attr('data-title', (d) => {
        const dateStr = d as string;
        return dateStr in data
          ? `${dateStr.slice(6, 8)}/${dateStr.slice(4, 6)}/${dateStr.slice(0, 4)}: ${data[dateStr]} submissions`
          : '';
      });
  };

  useEffect(() => {
    // console.log('Submissions:', submissions); // Debug: Log submissions
    if (!svgRef.current || !submissions) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('class', 'RdYlGn');

    const group = svg
      .append('g')
      .attr('transform', `translate(${(width - cellSize * 53) / 2}, ${height - cellSize * 7 - 1})`);

    group
      .append('text')
      .attr('transform', `translate(-38,${cellSize * 3.5})rotate(-90)`)
      .style('text-anchor', 'middle')
      .style('fill', '#333')
      .style('font-size', '12px')
      .text(selectedYear);

    weekDays.forEach((day, i) => {
      group
        .append('text')
        .attr('transform', `translate(-5,${cellSize * (i + 1)})`)
        .style('text-anchor', 'end')
        .style('fill', '#666')
        .style('font-size', '10px')
        .attr('dy', '-.25em')
        .text(day);
    });

    group
      .selectAll('.legend')
      .data(months)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (_: string, i: number) => `translate(${((i + 1) * 53) / 12}, -10)`)
      .append('text')
      .style('text-anchor', 'middle')
      .style('fill', '#333')
      .style('font-size', '10px')
      .text((d: string) => d);

    group
      .selectAll('.day')
      .data(d3.timeDays(new Date(selectedYear, 0, 1), new Date(selectedYear + 1, 0, 1)))
      .enter()
      .append('rect')
      .attr('class', 'day')
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('x', (d: Date) => parseInt(d3.timeFormat('%U')(d), 10) * cellSize)
      .attr('y', (d: Date) => parseInt(d3.timeFormat('%w')(d), 10) * cellSize)
      .attr('fill', '#ebedf0')
      .datum(d3.timeFormat('%Y%m%d'));

    group
      .selectAll('.month')
      .data(d3.timeMonths(new Date(selectedYear, 0, 1), new Date(selectedYear + 1, 0, 1)))
      .enter()
      .append('path')
      .attr('class', 'month')
      .attr('d', monthPath);

    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('display', 'none');

    d3.selectAll('.day').on('mouseover', function (event: MouseEvent) {
      const target = this as SVGRectElement;
      const title = d3.select(target).attr('data-title');
      if (title) {
        tooltip
          .style('display', 'block')
          .html(title)
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 10}px`);
      }
    });

    d3.selectAll('.day').on('mouseout', () => {
      tooltip.style('display', 'none');
    });

    const filteredData = processSubmissions(submissions, filter, selectedYear);
    // console.log('Filtered Data:', filteredData); 
    plotHeatmap(filteredData);

    const stats = getStats(filteredData);
    d3.select('#heatmap-stats').html(
      `Submissions: ${stats.sum} over ${stats.numdays} days<br>Average: ${stats.avg} submissions/day<br>Max: ${stats.maxsub} submissions`
    );

    return () => {
      tooltip.remove();
    };
  }, [submissions, minYear, maxYear, filter, selectedYear]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as 'A' | 'C' | 'P' | 'V';
    setFilter(value);
    const filteredData = processSubmissions(submissions, value, selectedYear);
    console.log(`Filter: ${value}, Filtered Data:`, filteredData); // Debug
    plotHeatmap(filteredData);
    const stats = getStats(filteredData);
    d3.select('#heatmap-stats').html(
      `Submissions: ${stats.sum} over ${stats.numdays} days<br>Average: ${stats.avg} submissions/day<br>Max: ${stats.maxsub} submissions`
    );
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(event.target.value, 10);
    setSelectedYear(newYear);
  };

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  return (
    <>
      <style>
        {`
          .RdYlGn .day {
            stroke: #ccc;
            stroke-width: 0.5px;
            shape-rendering: crispEdges;
          }

          .RdYlGn .month {
            fill: none;
            stroke: #333;
            stroke-width: 1px;
          }

          .tooltip {
            padding: 5px 10px;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            font-size: 12px;
            text-align: center;
            border-radius: 4px;
            pointer-events: none;
            z-index: 10;
          }

          .heatmap-select {
            padding: 4px;
            border-radius: 4px;
            border: 1px solid #ccc;
            background-color: white;
            font-size: 14px;
            cursor: pointer;
            color: black;
          }

          .heatmap-select:focus {
            outline: none;
            border-color: #3b82f6;
          }
        `}
      </style>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            {[
              { value: 'A', label: 'All' },
              { value: 'C', label: 'Contest' },
              { value: 'P', label: 'Practice' },
              { value: 'V', label: 'Virtual' },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="heatmap-filter"
                  value={value}
                  checked={filter === value}
                  onChange={handleFilterChange}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <select value={selectedYear} onChange={handleYearChange} className="heatmap-select">
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div id="heatmap-stats" className="text-center text-sm text-gray-500"></div>
        <svg ref={svgRef} className="w-full"></svg>
      </div>
    </>
  );
};


interface StudentProfileProps {
  student?: Student; 
}
// Main StudentProfile Component
const StudentProfile = ({ student: propStudent }: StudentProfileProps) => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [aiInsights, setAiInsights] = useState<{
    performance?: string;
    weakAreaPlan?: string;
    dailyProblems?: string;
    isGenerating: boolean;
    activeTab: 'performance' | 'weakness' | 'daily' | null;
  }>({ 
    isGenerating: false,
    activeTab: null
  });
  
  
  const [weakAreaInput, setWeakAreaInput] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: fetchedStudent, isLoading, error } = useQuery<Student, Error>({
    queryKey: ['student', id],
    queryFn: async () => {
      const response = await axios.get(`/students/${id}`);
      return response.data;
    },
    enabled: !propStudent && !!id,
  });
  

  const student = propStudent || fetchedStudent;


  // Helper function to convert Unix timestamp to Date
  const fromUnixTime = (seconds: number): Date => new Date(seconds * 1000);

  // Fetch blog entries from Codeforces API
  const { data: blogEntries } = useQuery({
    queryKey: ['codeforces-blogs', student?.codeforcesHandle],
    queryFn: async () => {
      if (!student?.codeforcesHandle) return [];
      try {
        const response = await axiosPublic.get(
          `https://codeforces.com/api/user.blogEntries?handle=${student.codeforcesHandle}`
        );
        return response.data.result.slice(0, 5) as CodeforcesBlogEntry[];
      } catch (e) {
        console.error('Failed to fetch blog entries:', e);
        toast('Failed to fetch blog entries', 'error');
        return [];
      }
    },
    enabled: !!student?.codeforcesHandle,
  });

  // Fetch detailed contest rating history from Codeforces API
  const { data: ratingHistory } = useQuery({
    queryKey: ['codeforces-rating', student?.codeforcesHandle],
    queryFn: async () => {
      if (!student?.codeforcesHandle) return [];
      try {
        const response = await axiosPublic.get(
          `https://codeforces.com/api/user.rating?handle=${student.codeforcesHandle}`
        );
        return response.data.result as CodeforcesRatingChange[];
      } catch (e) {
        // console.error('Failed to fetch rating history:', e);
        toast('Failed to fetch rating history', 'error');
        return [];
      }
    },
    enabled: !!student?.codeforcesHandle,
  });

  const { data: CodeforcesUserInfo } = useQuery({
    queryKey: ['codeforces-user-info', student?.codeforcesHandle],
    queryFn: async () => {
      if (!student?.codeforcesHandle) return null;
      try {
        const response = await axiosPublic.get(
          `https://codeforces.com/api/user.info?handles=${student.codeforcesHandle}`
        );
        return response.data.result[0] as CodeforcesUserInfo;
      } catch (e) {
        console.error('Failed to fetch user info:', e);
        toast('Failed to fetch user info', 'error');
        return null;
      }
    },
    enabled: !!student?.codeforcesHandle,
  });


  if (isLoading) return <div className="text-foreground"><Loader/></div>;
  if (error) return <div className="text-destructive">Error: {error.message}</div>;
  if (!student) return <div className="text-destructive">Student not found</div>;

  // Calculate problem solving statistics
  const solvedProblems = new Map<string, { rating: number }>();
  const verdictDistribution: Record<string, number> = {};
  const solvedByRating: Record<number, number> = {};

  student.submissions?.forEach((submission) => {
    verdictDistribution[submission.verdict] = (verdictDistribution[submission.verdict] || 0) + 1;
    if (submission.verdict === 'OK') {
      const problemKey = `${submission.contestId}_${submission.problemIndex}`;
      if (!solvedProblems.has(problemKey)) {
        solvedProblems.set(problemKey, {
          rating: submission.problemRating || 0,
        });
        if (submission.problemRating) {
          const ratingBucket = Math.floor(submission.problemRating / 100) * 100;
          solvedByRating[ratingBucket] = (solvedByRating[ratingBucket] || 0) + 1;
        }
      }
    }
  });

  // Calculate min/max years for heatmap
  const submissionDates = student.submissions?.map((sub) => fromUnixTime(sub.creationTimeSeconds)) || [];
  const minYear = submissionDates.length
    ? Math.min(...submissionDates.map((d) => d.getUTCFullYear()))
    : new Date().getUTCFullYear();
  const maxYear = submissionDates.length
    ? Math.max(...submissionDates.map((d) => d.getUTCFullYear()))
    : new Date().getUTCFullYear();

  // Prepare data for charts
  const submissionCountByMonth = student.submissions?.reduce(
    (acc: Record<string, number>, sub: Submission) => {
      const month = format(fromUnixTime(sub.creationTimeSeconds), 'yyyy-MM');
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    },
    {}
  ) || {};

  const submissionChartData = {
    labels: Object.keys(submissionCountByMonth),
    datasets: [
      {
        label: 'Submissions per Month',
        data: Object.values(submissionCountByMonth),
        backgroundColor: '#3b82f6',
        borderColor: '#1e40af',
        borderWidth: 1,
      },
    ],
  };

  const ratingValues = ratingHistory?.map((c) => c.newRating) || [];
  const minRating = Math.min(...ratingValues, Number.MAX_SAFE_INTEGER);
  const maxRating = Math.max(...ratingValues, 0);

  const contestRatingData = {
    labels:
      ratingHistory?.map((contest: CodeforcesRatingChange) =>
        format(fromUnixTime(contest.ratingUpdateTimeSeconds), 'MMM yyyy')
      ) || [],
    datasets: [
      {
        label: 'Contest Rating',
        data: ratingHistory?.map((contest: CodeforcesRatingChange) => contest.newRating) || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Rank',
        data: ratingHistory?.map((contest: CodeforcesRatingChange) => contest.rank) || [],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderDash: [5, 5],
        yAxisID: 'y1',
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const verdictChartData = {
    labels: Object.keys(verdictDistribution),
    datasets: [
      {
        data: Object.values(verdictDistribution),
        backgroundColor: [
          '#10b981', // OK - green
          '#ef4444', // WRONG_ANSWER - red
          '#f59e0b', // TIME_LIMIT_EXCEEDED - amber
          '#8b5cf6', // MEMORY_LIMIT_EXCEEDED - violet
          '#0ea5e9', // RUNTIME_ERROR - blue
          '#64748b', // Other - gray
        ],
        borderWidth: 1,
      },
    ],
  };

  const ratingKeys = Object.keys(solvedByRating)
    .map(Number)
    .sort((a, b) => a - b);
  const solvedByRatingData = {
    labels: ratingKeys.map((r) => `${r}-${r + 99}`),
    datasets: [
      {
        label: 'Solved Problems',
        data: ratingKeys.map((r) => solvedByRating[r]),
        backgroundColor: ratingKeys.map((r) => {
          if (r < 1200) return '#a3a3a3'; // Gray - Newbie
          if (r < 1400) return '#22c55e'; // Green - Pupil
          if (r < 1600) return '#0ea5e9'; // Blue - Specialist
          if (r < 1900) return '#8b5cf6'; // Violet - Expert
          if (r < 2100) return '#f97316'; // Orange - Candidate Master
          if (r < 2400) return '#ef4444'; // Red - Master
          return '#d946ef'; // International Master+
        }),
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Submissions per Month' },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Number of Submissions' },
      },
      x: {
        title: { display: true, text: 'Month' },
        ticks: { maxTicksLimit: 12, autoSkip: true },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Contest Rating History' },
    },
    scales: {
      y: {
        type: 'linear' as const,
        title: { display: true, text: 'Rating' },
        min: minRating === Number.MAX_SAFE_INTEGER ? 0 : Math.max(0, minRating - 200),
        max: maxRating === 0 ? 1000 : maxRating + 200,
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        title: { display: true, text: 'Rank' },
        grid: { drawOnChartArea: false },
        min: 1,
      },
      x: {
        title: { display: true, text: 'Contest Date' },
        ticks: { maxTicksLimit: 12, autoSkip: true },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const },
      title: { display: true, text: 'Verdict Distribution' },
    },
  };

  const solvedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Solved Problems by Rating' },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Solved Count' },
      },
      x: {
        title: { display: true, text: 'Problem Rating Range' },
      },
    },
  };

  const recentSubmissions = [...(student.submissions || [])]
    .sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds)
    .slice(0, 10);

  const recentContests = [...(student.contestHistory || [])]
    .sort((a, b) => b.ratingUpdateTimeSeconds - a.ratingUpdateTimeSeconds)
    .slice(0, 10);

    
    const generatePerformanceAnalysis = async () => {
      try {
        setAiInsights(prev => ({ ...prev, isGenerating: true, activeTab: 'performance' }));
        const analysis = await analyzePerformance(
          student!, 
          student?.submissions || [], 
          student?.contestHistory || []
        );
        setAiInsights(prev => ({ 
          ...prev, 
          performance: analysis,
          isGenerating: false 
        }));
        toast('Performance analysis generated successfully', 'success');
      } catch (error) {
        setAiInsights(prev => ({ ...prev, isGenerating: false }));
        // console.error('Error generating analysis:', error);
        toast('Error generating performance analysis', 'error');
      }
    };
  
    const generateWeakAreaTraining = async () => {
      if (!weakAreaInput.trim()) return;
      
      try {
        setAiInsights(prev => ({ ...prev, isGenerating: true, activeTab: 'weakness' }));
        const plan = await generateWeakAreaPlan(student!, weakAreaInput);
        setAiInsights(prev => ({ 
          ...prev, 
          weakAreaPlan: plan,
          isGenerating: false 
        }));
        toast('training plan generated successfully', 'success');
      } catch (error) {
        setAiInsights(prev => ({ ...prev, isGenerating: false }));
        console.error('Error generating weak area plan:', error);
        toast('Error generating training plan', 'error');
      }
    };
  
    const generateDailyProblems = async () => {
      try {
        setAiInsights(prev => ({ ...prev, isGenerating: true, activeTab: 'daily' }));
        const problems = await recommendDailyProblems(student!);
        setAiInsights(prev => ({ 
          ...prev, 
          dailyProblems: problems,
          isGenerating: false 
        }));
        toast('Daily problem set generated successfully', 'success');
      } catch (error) {
        setAiInsights(prev => ({ ...prev, isGenerating: false }));
        console.error('Error generating daily problems:', error);
        toast('Error generating daily problems', 'error');
      }
    };
  
    const toggleExpand = () => setExpanded(!expanded);

  const Badge = ({ children, variant }: { children: React.ReactNode; variant?: 'success' | 'destructive' | 'secondary' }) => {
    let className = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    if (variant === 'success') {
      className += ' bg-green-100 text-green-800';
    } else if (variant === 'destructive') {
      className += ' bg-red-100 text-red-800';
    } else {
      className += ' bg-gray-100 text-gray-800';
    }
    return <span className={className}>{children}</span>;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
       <div className='flex flex-col absolute top-5 right-5'>
        <ThemeToggle />
        <Button 
          onClick={async () => {
            setIsExporting(true);
            try {
              await exportStudentStatsToPDF(student);
            } catch (error) {
              console.error("Export failed:", error);
            } finally {
              setIsExporting(false);
            }
          }}
          size="icon"
          variant="outline"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </Button>


        </div>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 flex gap-3">
          {student.name}'s CF Stats 
          <Button 
          onClick={async () => {
            setIsExporting(true);
            toast('Exporting Complete Stats in PDF', 'info');
            try {
              await exportStudentStatsToPDF(student);
              toast('Stats Exported successfully', 'success');
            } catch (error) {
              console.error("Export failed:", error);
              toast('Stats Export failed', 'error');
            } finally {
              setIsExporting(false);
            }
          }}
          size="icon"
          variant="outline"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </Button>
        
        </h1>
        <Card className="bg-card mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>AI Coach Advisor</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleExpand}
                className="text-muted-foreground"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="mr-1 h-4 w-4" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-4 w-4" />
                    Expand
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          
          {expanded && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={generatePerformanceAnalysis}
                  disabled={aiInsights.isGenerating}
                  variant={aiInsights.activeTab === 'performance' ? 'default' : 'outline'}
                >
                  {aiInsights.isGenerating && aiInsights.activeTab === 'performance' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Full Performance Analysis
                </Button>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={weakAreaInput}
                    onChange={(e) => setWeakAreaInput(e.target.value)}
                    placeholder="Enter weak area (e.g., DP, Graphs)"
                    className="flex-1 px-3 py-2 border rounded-md text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button 
                    onClick={generateWeakAreaTraining}
                    disabled={aiInsights.isGenerating || !weakAreaInput.trim()}
                    variant={aiInsights.activeTab === 'weakness' ? 'default' : 'outline'}
                  >
                    {aiInsights.isGenerating && aiInsights.activeTab === 'weakness' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Focus Plan
                  </Button>
                </div>
                
                <Button 
                  onClick={generateDailyProblems}
                  disabled={aiInsights.isGenerating}
                  variant={aiInsights.activeTab === 'daily' ? 'default' : 'outline'}
                >
                  {aiInsights.isGenerating && aiInsights.activeTab === 'daily' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Today's Problem Set
                </Button>
              </div>

              {aiInsights.activeTab === 'performance' && aiInsights.performance && (
              <div className="p-4 border rounded-lg bg-card/50 min-h-32">
                <TypingEffect 
                  text={aiInsights.performance} 
                  speed={50} 
                  wordDelay={100}
                  punctuationDelay={30}
                />
                {aiInsights.isGenerating && (
                  <div className="mt-2 text-sm text-muted-foreground flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
            )}

            {aiInsights.activeTab === 'weakness' && aiInsights.weakAreaPlan && (
              <div className="p-4 border rounded-lg bg-card/50 min-h-32">
                <TypingEffect 
                  text={aiInsights.weakAreaPlan} 
                  speed={50} 
                  wordDelay={100}
                  punctuationDelay={300}
                /> 
                {aiInsights.isGenerating && (
                  <div className="mt-2 text-sm text-muted-foreground flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
            )}

            {aiInsights.activeTab === 'daily' && aiInsights.dailyProblems && (
              <div className="p-4 border rounded-lg bg-card/50 min-h-32">
                <TypingEffect 
                  text={aiInsights.dailyProblems} 
                  speed={50} 
                  wordDelay={100}
                  punctuationDelay={300}
                /> 
                {aiInsights.isGenerating && (
                  <div className="mt-2 text-sm text-muted-foreground flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
            )}
            </CardContent>
          )}
        </Card>

        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {student.currentRating || 0}
                <Badge variant={student.currentRating! >= student.maxRating! ? 'success' : 'secondary'}>
                  {student.currentRating! >= student.maxRating! ? 'Peak' : `${student.maxRating} max`}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Problems Solved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{solvedProblems.size}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{student.contestHistory?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{student.submissions?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last sync: {student.lastSynced ? format(student.lastSynced, 'MMM dd, yyyy') : 'Never'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Student Details */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="flex flex-col items-center mb-4">
                {CodeforcesUserInfo?.titlePhoto ? (
                  <img
                    src={CodeforcesUserInfo.titlePhoto}
                    alt={`${student.name}'s profile`}
                    className="profile-image"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="profile-image-fallback"
                  style={{ display: CodeforcesUserInfo?.titlePhoto ? 'none' : 'flex' }}
                >
                  No Image
                </div>
              </div>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{student.email}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Codeforces Handle:</span>
                  <a
                    href={`https://codeforces.com/profile/${student.codeforcesHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {student.codeforcesHandle}
                  </a>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Current Rating:</span>
                  <span>{student.currentRating || 'N/A'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Max Rating:</span>
                  <span>{student.maxRating || 'N/A'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Last Synced:</span>
                  <span>{student.lastSynced ? format(student.lastSynced, 'MMM dd, yyyy HH:mm') : 'Never'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Reminder Emails:</span>
                  <span>{student.reminderEmailsSent || 0}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Verdict Distribution */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Submission Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Pie data={verdictChartData} options={pieOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap Section */}
        <Card className="bg-card mb-8">
          <CardHeader>
            <CardTitle>Submission Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            {student.submissions?.length ? (
              <Heatmap submissions={student.submissions} minYear={minYear} maxYear={maxYear} />
            ) : (
              <div className="text-foreground/80 italic py-8 text-center">
                No submissions available for heatmap
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Submission History</CardTitle>
            </CardHeader>
            <CardContent>
              {student.submissions?.length ? (
                <div className="h-64" key={`submissions-${student._id}`}>
                  <Bar data={submissionChartData} options={barOptions} />
                </div>
              ) : (
                <div className="text-foreground/80 italic py-8 text-center">
                  No submissions available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Contest Rating History</CardTitle>
            </CardHeader>
            <CardContent>
              {(student.contestHistory?.length || ratingHistory?.length) ? (
                <div className="h-64" key={`rating-${student._id}`}>
                  <Line data={contestRatingData} options={lineOptions} />
                </div>
              ) : (
                <div className="text-foreground/80 italic py-8 text-center">
                  No contest history available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Blog Entries */}
        {blogEntries && blogEntries.length > 0 && (
          <Card className="bg-card mb-8">
            <CardHeader>
              <CardTitle>Recent Blog Entries</CardTitle>
              <p className="text-sm text-muted-foreground">Showing {blogEntries.length} blogs</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blogEntries.map((blog) => (
                  <div key={blog.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <a
                        href={`https://codeforces.com/blog/entry/${blog.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium flex-1"
                      >
                        {blog.title}
                      </a>
                      <span className="text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                        {format(fromUnixTime(blog.creationTimeSeconds), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant={blog.rating > 0 ? 'success' : 'secondary'}>
                        {blog.rating > 0 ? `+${blog.rating}` : blog.rating} votes
                      </Badge>
                      <Badge variant="secondary">{blog.commentCount} comments</Badge>
                      <Badge variant="secondary">
                        {Math.ceil((Date.now() / 1000 - blog.creationTimeSeconds) / (60 * 60 * 24))} days ago
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <a
                  href={`https://codeforces.com/blog/${student.codeforcesHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  View all blogs on Codeforces
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Solved Problems by Rating */}
        <Card className="bg-card mb-8">
          <CardHeader>
            <CardTitle>Solved Problems by Rating</CardTitle>
          </CardHeader>
          <CardContent>
            {solvedProblems.size ? (
              <div className="h-64" key={`solved-${student._id}`}>
                <Bar data={solvedByRatingData} options={solvedOptions} />
              </div>
            ) : (
              <div className="text-foreground/80 italic py-8 text-center">
                No solved problems available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSubmissions.length ? (
                <div className="max-h-96 overflow-y-auto">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Problem
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rating
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Verdict
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentSubmissions.map((sub) => (
                          <tr key={sub.submissionId} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {sub.problemName || `Problem ${sub.problemIndex}`}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{sub.problemRating || 'N/A'}</div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <Badge
                                variant={sub.verdict === 'OK' ? 'success' : sub.verdict === 'WRONG_ANSWER' ? 'destructive' : 'secondary'}
                              >
                                {sub.verdict}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {format(fromUnixTime(sub.creationTimeSeconds), 'MMM dd, HH:mm')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-foreground/80 italic py-8 text-center">
                  No recent submissions
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Recent Contests</CardTitle>
            </CardHeader>
            <CardContent>
              {recentContests.length ? (
                <div className="max-h-96 overflow-y-auto">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contest
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rating Change
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentContests.map((contest) => {
                          const ratingChange = contest.newRating - contest.oldRating;
                          return (
                            <tr key={contest.contestId} className="hover:bg-gray-50">
                              <td className="px-4 py-2 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{contest.contestName}</div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">#{contest.rank}</td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <Badge variant={ratingChange >= 0 ? 'success' : 'destructive'}>
                                  {ratingChange >= 0 ? '+' : ''}{ratingChange}
                                </Badge>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                {format(fromUnixTime(contest.ratingUpdateTimeSeconds), 'MMM dd, yyyy')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-foreground/80 italic py-8 text-center">
                  No recent contests
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;